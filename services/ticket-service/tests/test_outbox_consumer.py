# SPDX-License-Identifier: Apache-2.0
"""DX-FSM Ticket Service — Outbox consumer tests (A5.4)."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from uuid import uuid4
from datetime import datetime, timezone

from app.services.outbox_metrics import OutboxMetrics, get_metrics, reset_metrics


class TestOutboxMetrics:
    def setup_method(self):
        reset_metrics()

    def test_record_sent(self):
        m = get_metrics()
        m.record_sent(150.5)
        m.record_sent(200.0)
        snap = m.snapshot()
        assert snap["total_sent"] == 2
        assert snap["avg_latency_ms"] == 175.25

    def test_record_failed(self):
        m = get_metrics()
        m.record_failed("ConnectError")
        m.record_failed("HTTP 500")
        snap = m.snapshot()
        assert snap["total_failed"] == 2
        assert snap["consecutive_failures"] == 2
        assert snap["circuit_open"] is True

    def test_record_retried(self):
        m = get_metrics()
        m.record_retried()
        m.record_retried()
        snap = m.snapshot()
        assert snap["total_retried"] == 2

    def test_record_dlq(self):
        m = get_metrics()
        m.record_dlq()
        snap = m.snapshot()
        assert snap["total_dlq"] == 1

    def test_circuit_breaker_opens(self):
        m = OutboxMetrics()
        for _ in range(5):
            m.record_failed("err")
        assert m.is_circuit_open(threshold=5) is True

    def test_circuit_breaker_resets_on_success(self):
        m = OutboxMetrics()
        m.record_failed("err")
        m.record_failed("err")
        m.record_sent(100)
        snap = m.snapshot()
        assert snap["consecutive_failures"] == 0
        assert snap["circuit_open"] is False

    def test_circuit_breaker_cooldown(self):
        m = OutboxMetrics()
        for _ in range(5):
            m.record_failed("err")
        assert m.is_circuit_open(threshold=5) is True
        # Open circuit
        m.open_circuit(cooldown_sec=1)
        # Still open immediately
        assert m.is_circuit_open(threshold=5) is True

    def test_snapshot_includes_recent_errors(self):
        m = get_metrics()
        m.record_failed("Error A")
        m.record_failed("Error B")
        snap = m.snapshot()
        assert len(snap["recent_errors"]) == 2
        assert snap["recent_errors"][0]["error"] == "Error A"

    def test_snapshot_avg_latency_zero_when_empty(self):
        m = get_metrics()
        snap = m.snapshot()
        assert snap["avg_latency_ms"] == 0.0
        assert snap["total_sent"] == 0

    def test_uptime_reported(self):
        m = get_metrics()
        import time
        time.sleep(0.1)
        snap = m.snapshot()
        assert snap["uptime_seconds"] > 0


class TestOutboxDLQDispatcher:
    """Test DLQ dispatcher functions (async-safe)."""

    @pytest.mark.asyncio
    async def test_count_dlq_empty(self):
        from app.services.outbox_dlq_dispatcher import count_dlq
        from app.db.database import AsyncSessionLocal
        async with AsyncSessionLocal() as db:
            count = await count_dlq(db)
            assert count >= 0

    @pytest.mark.asyncio
    async def test_list_dlq_empty(self):
        from app.services.outbox_dlq_dispatcher import list_dlq
        from app.db.database import AsyncSessionLocal
        async with AsyncSessionLocal() as db:
            entries = await list_dlq(db, limit=10)
            assert isinstance(entries, list)


class TestOutboxMetricsClass:
    def test_consecutive_failures_tracking(self):
        m = OutboxMetrics()
        m.record_sent(100)
        m.record_failed("err1")
        m.record_failed("err2")
        m.record_sent(50)
        # After success, consecutive resets
        assert m._consecutive_failures == 0
        m.record_failed("err3")
        assert m._consecutive_failures == 1

    def test_circuit_open_with_cooldown_auto_close(self):
        m = OutboxMetrics()
        # 5 failures = circuit open
        for _ in range(5):
            m.record_failed("err")
        # Auto-close after cooldown (1 second)
        import time
        m.open_circuit(cooldown_sec=1)
        # Before cooldown
        assert m.is_circuit_open(threshold=5) is True
        # After cooldown
        time.sleep(1.1)
        assert m.is_circuit_open(threshold=5) is False
        assert m._consecutive_failures == 0

    def test_snapshot_keys(self):
        m = get_metrics()
        snap = m.snapshot()
        required_keys = [
            "total_sent", "total_failed", "total_retried", "total_dlq",
            "avg_latency_ms", "consecutive_failures", "circuit_open",
            "uptime_seconds", "recent_errors",
        ]
        for k in required_keys:
            assert k in snap, f"Missing key: {k}"
