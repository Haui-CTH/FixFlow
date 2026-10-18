# SPDX-License-Identifier: Apache-2.0
"""DX-FSM Ticket Service – Outbox metrics + circuit breaker (A5.4)

Counter + circuit breaker cho outbox dispatcher.
Circuit breaker: khi n8n fail liên tục → tạm dừng worker để tránh spam.
"""

import time
import logging
import threading
from collections import deque
from typing import Optional

logger = logging.getLogger(__name__)


class OutboxMetrics:
    """
    In-memory metrics cho outbox dispatcher.

    Track: sent, failed, retried, total latency, errors.
    Thread-safe.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._total_sent = 0
        self._total_failed = 0
        self._total_retried = 0
        self._total_dlq = 0
        self._recent_latencies_ms: deque = deque(maxlen=100)
        self._recent_errors: deque = deque(maxlen=20)
        self._started_at = time.time()
        # Circuit breaker state
        self._consecutive_failures = 0
        self._circuit_open_until: float = 0.0

    def record_sent(self, latency_ms: float) -> None:
        with self._lock:
            self._total_sent += 1
            self._recent_latencies_ms.append(latency_ms)
            self._consecutive_failures = 0  # reset

    def record_failed(self, error: str) -> None:
        with self._lock:
            self._total_failed += 1
            self._consecutive_failures += 1
            self._recent_errors.append({
                "error": error[:200],
                "at": time.time(),
            })

    def record_retried(self) -> None:
        with self._lock:
            self._total_retried += 1

    def record_dlq(self) -> None:
        with self._lock:
            self._total_dlq += 1

    def is_circuit_open(self, threshold: int = 5, cooldown_sec: int = 60) -> bool:
        """
        Circuit breaker:
          - Nếu consecutive_failures >= threshold → mở circuit
          - Circuit auto-close sau cooldown_sec
        """
        with self._lock:
            if self._consecutive_failures < threshold:
                return False
            if time.time() < self._circuit_open_until:
                return True
            # Cooldown đã qua — reset và close
            logger.info("Circuit breaker: closing after cooldown")
            self._consecutive_failures = 0
            return False

    def open_circuit(self, cooldown_sec: int = 60) -> None:
        with self._lock:
            self._circuit_open_until = time.time() + cooldown_sec
            logger.warning(
                f"Circuit breaker: opened for {cooldown_sec}s "
                f"(consecutive_failures={self._consecutive_failures})"
            )

    def snapshot(self) -> dict:
        with self._lock:
            uptime = time.time() - self._started_at
            avg_latency = (
                sum(self._recent_latencies_ms) / len(self._recent_latencies_ms)
                if self._recent_latencies_ms
                else 0.0
            )
            return {
                "total_sent": self._total_sent,
                "total_failed": self._total_failed,
                "total_retried": self._total_retried,
                "total_dlq": self._total_dlq,
                "avg_latency_ms": round(avg_latency, 2),
                "consecutive_failures": self._consecutive_failures,
                "circuit_open": self._consecutive_failures >= 5,
                "uptime_seconds": round(uptime, 1),
                "recent_errors": list(self._recent_errors),
            }


# Global instance
_metrics = OutboxMetrics()


def get_metrics() -> OutboxMetrics:
    return _metrics


def reset_metrics() -> None:
    global _metrics
    _metrics = OutboxMetrics()
