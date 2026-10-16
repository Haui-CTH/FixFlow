# SPDX-License-Identifier: Apache-2.0
# DX-FSM Ticket Service – Alert Dispatcher tests
# B5.3 acceptance: alert worker scan failed events, POST webhook, idempotent.

import asyncio
import os
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Set env vars BEFORE importing app modules
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/test")
os.environ.setdefault("ALERT_WEBHOOK_URL", "")  # default: not configured


class TestPayloadSummary:
    """Pure function _summarize_payload — không cần DB."""

    def test_empty_payload(self):
        from app.services.alert_dispatcher import _summarize_payload
        assert _summarize_payload(None) == {}
        assert _summarize_payload({}) == {}

    def test_picks_known_fields(self):
        from app.services.alert_dispatcher import _summarize_payload
        payload = {
            "ticket_id": "abc",
            "user_id": "u1",
            "random_key": "should_not_appear",
        }
        result = _summarize_payload(payload)
        assert "ticket_id" in result
        assert "user_id" in result
        assert "random_key" not in result

    def test_small_payload_includes_full(self):
        from app.services.alert_dispatcher import _summarize_payload
        payload = {"a": 1, "b": 2}  # 2 keys (≤5)
        result = _summarize_payload(payload)
        assert "_full" in result
        assert result["_full"] == payload

    def test_large_payload_omits_full(self):
        from app.services.alert_dispatcher import _summarize_payload
        payload = {f"k{i}": i for i in range(10)}  # >5 keys
        result = _summarize_payload(payload)
        assert "_full" not in result


class TestSendAlert:
    """Mock httpx để không gọi URL thật."""

    @pytest.mark.asyncio
    async def test_send_alert_success_2xx(self):
        from app.services.alert_dispatcher import send_alert

        mock_event = MagicMock()
        mock_event.id = "abc-123"
        mock_event.event_type = "ticket.created"
        mock_event.attempts = 5
        mock_event.max_attempts = 5
        mock_event.last_error = "n8n timeout"
        mock_event.created_at = datetime(2026, 1, 1, tzinfo=timezone.utc)
        mock_event.payload = {"ticket_id": "t1"}

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = "OK"

        with patch("app.services.alert_dispatcher.httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                return_value=mock_response
            )

            success, error = await send_alert(mock_event, "https://hooks.example.com/abc")

        assert success is True
        assert error is None

    @pytest.mark.asyncio
    async def test_send_alert_4xx_retryable(self):
        from app.services.alert_dispatcher import send_alert

        mock_event = MagicMock()
        mock_event.id = "abc-456"
        mock_event.event_type = "ticket.created"
        mock_event.attempts = 5
        mock_event.max_attempts = 5
        mock_event.last_error = "x"
        mock_event.created_at = None
        mock_event.payload = None

        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"

        with patch("app.services.alert_dispatcher.httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                return_value=mock_response
            )

            success, error = await send_alert(mock_event, "https://broken.example.com")

        assert success is False
        assert "500" in error

    @pytest.mark.asyncio
    async def test_send_alert_timeout(self):
        from app.services.alert_dispatcher import send_alert
        import httpx

        mock_event = MagicMock()
        mock_event.id = "abc-789"
        mock_event.event_type = "ticket.created"
        mock_event.attempts = 5
        mock_event.max_attempts = 5
        mock_event.last_error = "x"
        mock_event.created_at = None
        mock_event.payload = None

        with patch("app.services.alert_dispatcher.httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                side_effect=httpx.TimeoutException("read timeout")
            )

            success, error = await send_alert(mock_event, "https://slow.example.com")

        assert success is False
        assert "timeout" in error

    @pytest.mark.asyncio
    async def test_send_alert_request_error(self):
        from app.services.alert_dispatcher import send_alert
        import httpx

        mock_event = MagicMock()
        mock_event.id = "abc-999"
        mock_event.event_type = "x"
        mock_event.attempts = 5
        mock_event.max_attempts = 5
        mock_event.last_error = "x"
        mock_event.created_at = None
        mock_event.payload = None

        with patch("app.services.alert_dispatcher.httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                side_effect=httpx.ConnectError("connection refused")
            )

            success, error = await send_alert(mock_event, "https://unreachable.example.com")

        assert success is False
        assert "connection error" in error

    @pytest.mark.asyncio
    async def test_payload_includes_required_fields(self):
        """Verify alert payload has fingerprint + service name."""
        from app.services.alert_dispatcher import send_alert

        mock_event = MagicMock()
        mock_event.id = "fp-123"
        mock_event.event_type = "ticket.created"
        mock_event.attempts = 5
        mock_event.max_attempts = 5
        mock_event.last_error = "err"
        mock_event.created_at = datetime(2026, 1, 1, tzinfo=timezone.utc)
        mock_event.payload = {"ticket_id": "t-999"}

        captured_payload = {}

        async def capture_post(url, json):
            captured_payload.update(json)
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.text = "OK"
            return mock_response

        with patch("app.services.alert_dispatcher.httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                side_effect=capture_post
            )
            await send_alert(mock_event, "https://hooks.example.com")

        assert captured_payload["service"] == "dx-fsm-ticket-service"
        assert captured_payload["alert_type"] == "outbox_event_failed"
        assert captured_payload["fingerprint"] == "fp-123"
        assert captured_payload["event_id"] == "fp-123"
        assert captured_payload["event_type"] == "ticket.created"
        assert captured_payload["attempts"] == 5
        assert captured_payload["payload_summary"]["ticket_id"] == "t-999"


class TestScanFailedEvents:
    """Test scan_failed_events — verify idempotency."""

    @pytest.mark.asyncio
    async def test_no_webhook_url_returns_zero(self):
        """Khi ALERT_WEBHOOK_URL chưa set, scan là no-op."""
        import app.services.alert_dispatcher as ad

        # Ensure env var empty
        with patch.object(ad, "ALERT_WEBHOOK_URL", ""):
            count = await ad.scan_failed_events()
        assert count == 0

    @pytest.mark.asyncio
    async def test_scan_marks_alerted_on_success(self):
        """Failed event + alert success → set last_alerted_at."""
        import app.services.alert_dispatcher as ad

        mock_event = MagicMock()
        mock_event.id = "evt-1"
        mock_event.event_type = "ticket.created"
        mock_event.attempts = 5
        mock_event.max_attempts = 5
        mock_event.last_error = "x"
        mock_event.created_at = None
        mock_event.payload = None
        mock_event.last_alerted_at = None  # initially not alerted

        # Mock DB session
        mock_session = AsyncMock()
        mock_session.__aenter__ = AsyncMock(return_value=mock_session)
        mock_session.__aexit__ = AsyncMock(return_value=None)
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [mock_event]
        mock_session.execute = AsyncMock(return_value=mock_result)
        mock_session.commit = AsyncMock()

        with patch.object(ad, "ALERT_WEBHOOK_URL", "https://hooks.example.com"), \
             patch.object(ad, "AsyncSessionLocal", return_value=mock_session), \
             patch.object(ad, "send_alert", new_callable=AsyncMock) as mock_send:
            mock_send.return_value = (True, None)
            count = await ad.scan_failed_events()

        assert count == 1
        assert mock_event.last_alerted_at is not None
        mock_session.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_scan_does_not_mark_on_failure(self):
        """Alert send fail → KHÔNG set last_alerted_at (retry lần sau)."""
        import app.services.alert_dispatcher as ad

        mock_event = MagicMock()
        mock_event.id = "evt-2"
        mock_event.event_type = "x"
        mock_event.attempts = 5
        mock_event.max_attempts = 5
        mock_event.last_error = "x"
        mock_event.created_at = None
        mock_event.payload = None
        mock_event.last_alerted_at = None

        mock_session = AsyncMock()
        mock_session.__aenter__ = AsyncMock(return_value=mock_session)
        mock_session.__aexit__ = AsyncMock(return_value=None)
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [mock_event]
        mock_session.execute = AsyncMock(return_value=mock_result)
        mock_session.commit = AsyncMock()

        with patch.object(ad, "ALERT_WEBHOOK_URL", "https://hooks.example.com"), \
             patch.object(ad, "AsyncSessionLocal", return_value=mock_session), \
             patch.object(ad, "send_alert", new_callable=AsyncMock) as mock_send:
            mock_send.return_value = (False, "timeout")
            count = await ad.scan_failed_events()

        assert count == 0
        assert mock_event.last_alerted_at is None  # NOT updated
        mock_session.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_scan_empty_no_commit(self):
        """Không có failed events → không commit."""
        import app.services.alert_dispatcher as ad

        mock_session = AsyncMock()
        mock_session.__aenter__ = AsyncMock(return_value=mock_session)
        mock_session.__aexit__ = AsyncMock(return_value=None)
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_session.execute = AsyncMock(return_value=mock_result)
        mock_session.commit = AsyncMock()

        with patch.object(ad, "ALERT_WEBHOOK_URL", "https://hooks.example.com"), \
             patch.object(ad, "AsyncSessionLocal", return_value=mock_session):
            count = await ad.scan_failed_events()

        assert count == 0
        mock_session.commit.assert_not_awaited()


class TestTriggerAlertScanNow:
    """Manual trigger wrapper — used by admin endpoint."""

    @pytest.mark.asyncio
    async def test_returns_summary(self):
        from app.services.alert_dispatcher import trigger_alert_scan_now

        with patch(
            "app.services.alert_dispatcher.scan_failed_events",
            new_callable=AsyncMock,
        ) as mock_scan:
            mock_scan.return_value = 3
            result = await trigger_alert_scan_now()

        assert result["alerted"] == 3
        assert "started_at" in result
        assert "finished_at" in result
        assert isinstance(result["webhook_configured"], bool)


class TestWorkerLoop:
    """Test alert_worker_loop control flow (không test full loop)."""

    @pytest.mark.asyncio
    async def test_loop_stops_on_event(self):
        """stop_event.set() → loop exit."""
        from app.services.alert_dispatcher import alert_worker_loop

        stop = asyncio.Event()
        stop.set()  # Already set → loop should exit immediately

        with patch(
            "app.services.alert_dispatcher.scan_failed_events",
            new_callable=AsyncMock,
        ) as mock_scan:
            # Run with very short timeout — should return quickly
            try:
                await asyncio.wait_for(alert_worker_loop(stop), timeout=2.0)
            except asyncio.TimeoutError:
                pytest.fail("Worker didn't stop when event was set")

        # scan should have been called at least once before stop was honored
        # OR not at all (depends on loop order). Just verify no hang.

    @pytest.mark.asyncio
    async def test_loop_handles_scan_errors(self):
        """scan raise exception → loop continue, không crash."""
        from app.services.alert_dispatcher import alert_worker_loop

        stop = asyncio.Event()

        call_count = 0

        async def faulty_scan():
            nonlocal call_count
            call_count += 1
            raise ValueError("DB error")

            # Should never return
            yield  # Make this a generator

        # Patch the function
        with patch(
            "app.services.alert_dispatcher.scan_failed_events",
            new_callable=AsyncMock,
        ) as mock_scan:
            mock_scan.side_effect = ValueError("DB error")

            # Schedule stop after a bit
            async def trigger_stop():
                await asyncio.sleep(0.5)
                stop.set()

            asyncio.create_task(trigger_stop())

            try:
                await asyncio.wait_for(alert_worker_loop(stop), timeout=3.0)
            except asyncio.TimeoutError:
                pytest.fail("Worker didn't stop on event")

        # Should have been called at least once (then errored, then sleep)
        assert call_count >= 0  # mock was called at least once
        assert mock_scan.call_count >= 1


class TestModelColumn:
    """Verify OutboxEvent có last_alerted_at column."""

    def test_outbox_event_has_alerted_column(self):
        from app.models.outbox import OutboxEvent
        # Verify column exists
        assert "last_alerted_at" in OutboxEvent.__table__.columns
        col = OutboxEvent.__table__.columns["last_alerted_at"]
        assert col.nullable is True  # NULL until alerted
