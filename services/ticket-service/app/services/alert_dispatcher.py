# SPDX-License-Identifier: Apache-2.0
# DX-FSM Ticket Service – Alert Dispatcher
# Background loop scan outbox_events.status = 'failed', POST webhook với
# payload để ops biết. Idempotent: chỉ alert 1 lần/event qua last_alerted_at.

import asyncio
import logging
import os
from datetime import datetime, timezone
from typing import Optional

import httpx
from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.outbox import OutboxEvent

logger = logging.getLogger(__name__)

# ─── Config ──────────────────────────────────────────────────────────────

# Webhook URL — PagerDuty / Slack / email gateway
ALERT_WEBHOOK_URL = os.getenv("ALERT_WEBHOOK_URL", "")

# Worker scan interval (giây)
WORKER_INTERVAL_SEC = int(os.getenv("ALERT_INTERVAL_SEC", "60"))

# HTTP timeout cho webhook call
HTTP_TIMEOUT_SEC = 10.0


# ─── Alert sender ───────────────────────────────────────────────────────


async def send_alert(event: OutboxEvent, webhook_url: str) -> tuple[bool, Optional[str]]:
    """
    POST event info tới webhook. Trả về (success, error_message).
    """
    payload = {
        "service": "dx-fsm-ticket-service",
        "alert_type": "outbox_event_failed",
        "event_id": str(event.id),
        "event_type": event.event_type,
        "attempts": event.attempts,
        "max_attempts": event.max_attempts,
        "last_error": event.last_error,
        "created_at": event.created_at.isoformat() if event.created_at else None,
        "payload_summary": _summarize_payload(event.payload),
        "fingerprint": str(event.id),  # dedup key cho receivers
    }

    try:
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT_SEC) as client:
            response = await client.post(webhook_url, json=payload)

        if 200 <= response.status_code < 300:
            logger.info(
                f"Alert sent for event {event.id} "
                f"(status={response.status_code})"
            )
            return True, None
        else:
            error = f"HTTP {response.status_code}: {response.text[:200]}"
            logger.warning(f"Alert webhook returned {error} for event {event.id}")
            return False, error
    except httpx.TimeoutException:
        return False, "timeout"
    except httpx.RequestError as e:
        return False, f"connection error: {e}"
    except Exception as e:
        logger.exception(f"Unexpected error sending alert for event {event.id}")
        return False, str(e)


def _summarize_payload(payload: dict | None) -> dict:
    """Truncate payload để alert message ngắn gọn."""
    if not payload:
        return {}

    # Pick a few common fields
    summary = {}
    for key in ("ticket_id", "ticket_number", "user_id", "status", "type"):
        if key in payload:
            summary[key] = payload[key]

    # Include full payload if small
    if len(payload) <= 5:
        summary["_full"] = payload

    return summary


# ─── Worker loop ────────────────────────────────────────────────────────


async def scan_failed_events() -> int:
    """
    Tìm events status='failed' chưa alert. Gửi alert + đánh dấu last_alerted_at.

    Returns: số events đã alert trong lần scan này.
    """
    if not ALERT_WEBHOOK_URL:
        logger.debug("ALERT_WEBHOOK_URL not set — skipping scan")
        return 0

    async with AsyncSessionLocal() as db:
        # Find failed events not yet alerted
        result = await db.execute(
            select(OutboxEvent)
            .where(OutboxEvent.status == "failed")
            .where(OutboxEvent.last_alerted_at.is_(None))
            .limit(50)  # batch
        )
        events = result.scalars().all()

        if not events:
            return 0

        alerted_count = 0
        for event in events:
            success, error = await send_alert(event, ALERT_WEBHOOK_URL)

            if success:
                event.last_alerted_at = datetime.now(timezone.utc)
                alerted_count += 1
            else:
                # Don't update last_alerted_at; will retry on next scan
                logger.debug(
                    f"Alert send failed for event {event.id}: {error}. "
                    f"Will retry next scan."
                )

        await db.commit()
        logger.info(f"Alert scan: {alerted_count}/{len(events)} events alerted")
        return alerted_count


async def alert_worker_loop(stop_event: Optional[asyncio.Event] = None) -> None:
    """
    Background loop chạy mỗi WORKER_INTERVAL_SEC. Started bởi lifespan.
    """
    logger.info(
        f"Alert dispatcher worker started "
        f"(interval={WORKER_INTERVAL_SEC}s, webhook={'set' if ALERT_WEBHOOK_URL else 'NOT SET'})"
    )

    while True:
        if stop_event and stop_event.is_set():
            logger.info("Alert worker stopping (stop event set)")
            break

        try:
            await scan_failed_events()
        except Exception as e:
            logger.exception(f"Error in alert worker iteration: {e}")

        # Sleep with cancellation support
        try:
            if stop_event:
                await asyncio.wait_for(
                    stop_event.wait(), timeout=WORKER_INTERVAL_SEC
                )
                # If we get here, stop was set
                break
            else:
                await asyncio.sleep(WORKER_INTERVAL_SEC)
        except asyncio.TimeoutError:
            # Normal: timeout reached, continue loop
            continue


# ─── Manual trigger (admin endpoint) ────────────────────────────────────


async def trigger_alert_scan_now() -> dict:
    """
    Run scan_failed_events() ngay lập tức, dùng cho admin manual trigger.
    Trả về dict summary.
    """
    started_at = datetime.now(timezone.utc)
    count = await scan_failed_events()
    finished_at = datetime.now(timezone.utc)
    return {
        "alerted": count,
        "started_at": started_at.isoformat(),
        "finished_at": finished_at.isoformat(),
        "webhook_configured": bool(ALERT_WEBHOOK_URL),
    }
