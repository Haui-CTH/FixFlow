# SPDX-License-Identifier: Apache-2.0
# DX-FSM Ticket Service – Outbox Dispatcher
# Reliable webhook delivery với retry + backoff.
# Tables: outbox_events (id, event_type, payload, status, attempts, ...).

import asyncio
import logging
import time
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

import httpx
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import AsyncSessionLocal
from app.models.outbox import OutboxEvent
from app.config import get_settings
from app.services.outbox_metrics import get_metrics
from app.services.outbox_dlq_dispatcher import move_to_dlq

logger = logging.getLogger(__name__)
settings = get_settings()

# ─── Backoff schedule (seconds) ──────────────────────────────────────────
# attempts=1: 5s, 2: 25s, 3: 125s, 4: 625s, 5: fail
BACKOFF_SECONDS = [5, 25, 125, 625, 3125]

# Worker scan interval
WORKER_INTERVAL_SEC = 30


def _compute_next_retry(attempts: int) -> datetime:
    """Trả về datetime = NOW() + backoff[attempts-1]."""
    idx = min(attempts - 1, len(BACKOFF_SECONDS) - 1)
    return datetime.now(timezone.utc) + timedelta(seconds=BACKOFF_SECONDS[idx])


async def enqueue_event(
    db: AsyncSession,
    event_type: str,
    payload: dict,
) -> OutboxEvent:
    """
    INSERT một outbox event. Thường gọi trong cùng transaction với ticket creation.
    """
    event = OutboxEvent(
        id=uuid.uuid4(),
        event_type=event_type,
        payload=payload,
        status="pending",
        attempts=0,
        next_retry_at=datetime.now(timezone.utc),
    )
    db.add(event)
    await db.flush()  # Lấy ID ngay, nhưng chưa commit
    return event


# ─── Worker ──────────────────────────────────────────────────────────────


async def fetch_pending_events(db: AsyncSession, limit: int = 10) -> list[OutboxEvent]:
    """
    Lấy các event sẵn sàng để xử lý:
      - status = 'pending'
      - next_retry_at <= NOW() (null = sẵn sàng ngay)
    """
    stmt = (
        select(OutboxEvent)
        .where(OutboxEvent.status == "pending")
        .where(OutboxEvent.next_retry_at.is_(None) | (OutboxEvent.next_retry_at <= datetime.now(timezone.utc)))
        .order_by(OutboxEvent.created_at)
        .limit(limit)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def mark_event_sending(db: AsyncSession, event_id: uuid.UUID) -> bool:
    """Optimistic lock: chỉ update nếu status='pending' (atomic claim)."""
    stmt = (
        update(OutboxEvent)
        .where(OutboxEvent.id == event_id, OutboxEvent.status == "pending")
        .values(status="sending", updated_at=datetime.now(timezone.utc))
        .execution_options(synchronize_session=False)
    )
    result = await db.execute(stmt)
    return result.rowcount > 0


async def mark_event_sent(db: AsyncSession, event_id: uuid.UUID):
    stmt = (
        update(OutboxEvent)
        .where(OutboxEvent.id == event_id)
        .values(
            status="sent",
            sent_at=datetime.now(timezone.utc),
            last_error=None,
            updated_at=datetime.now(timezone.utc),
        )
    )
    await db.execute(stmt)


async def mark_event_failed(
    db: AsyncSession,
    event: OutboxEvent,
    error: str,
):
    """Increment attempts, schedule retry hoặc mark failed."""
    new_attempts = event.attempts + 1
    if new_attempts >= event.max_attempts:
        # Hết retry → status=failed
        stmt = (
            update(OutboxEvent)
            .where(OutboxEvent.id == event.id)
            .values(
                status="failed",
                attempts=new_attempts,
                last_error=error[:500],
                updated_at=datetime.now(timezone.utc),
            )
        )
    else:
        # Schedule retry
        next_retry = _compute_next_retry(new_attempts)
        stmt = (
            update(OutboxEvent)
            .where(OutboxEvent.id == event.id)
            .values(
                status="pending",
                attempts=new_attempts,
                last_error=error[:500],
                next_retry_at=next_retry,
                updated_at=datetime.now(timezone.utc),
            )
        )
    await db.execute(stmt)


async def call_n8n(event: OutboxEvent) -> tuple[bool, Optional[str], float]:
    """
    Gọi n8n webhook. Trả về (ok, error_message, latency_ms).
    """
    url = f"{settings.n8n_webhook_url}/{event.event_type}"
    start = time.time()
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(url, json=event.payload)
            latency_ms = (time.time() - start) * 1000
            if 200 <= resp.status_code < 300:
                return True, None, latency_ms
            return False, f"HTTP {resp.status_code}: {resp.text[:200]}", latency_ms
    except httpx.ConnectError:
        return False, "ConnectError (n8n unavailable)", (time.time() - start) * 1000
    except httpx.TimeoutException:
        return False, "Timeout", (time.time() - start) * 1000
    except Exception as e:
        return False, f"Exception: {e}", (time.time() - start) * 1000


async def process_one_event(event: OutboxEvent) -> str:
    """
    Xử lý một event: claim, call n8n, update status.
    Trả về "sent" | "retry" | "failed" | "dlq".
    Tích hợp metrics + DLQ.
    """
    metrics = get_metrics()
    # Circuit breaker check
    if metrics.is_circuit_open():
        return "skipped"

    async with AsyncSessionLocal() as db:
        # Atomic claim
        claimed = await mark_event_sending(db, event.id)
        if not claimed:
            return "skipped"
        await db.commit()

    # Gọi n8n NGOÀI transaction
    ok, error, latency_ms = await call_n8n(event)

    async with AsyncSessionLocal() as db:
        if ok:
            await mark_event_sent(db, event.id)
            await db.commit()
            metrics.record_sent(latency_ms)
            return "sent"
        else:
            await mark_event_failed(db, event, error or "unknown")
            await db.commit()
            metrics.record_failed(error or "unknown")
            # Re-fetch để biết status thực sự
            fresh = await db.get(OutboxEvent, event.id)
            if fresh and fresh.status == "failed":
                await move_to_dlq(db, fresh)
                await db.commit()
                metrics.record_dlq()
                if metrics._consecutive_failures >= 5:
                    metrics.open_circuit()
                return "dlq"
    return "failed"


async def run_outbox_worker_once() -> dict:
    """Một lần scan. Trả về summary."""
    summary = {"fetched": 0, "sent": 0, "retry": 0, "failed": 0, "skipped": 0, "dlq": 0}

    async with AsyncSessionLocal() as db:
        events = await fetch_pending_events(db)

    summary["fetched"] = len(events)

    for ev in events:
        result = await process_one_event(ev)
        if result == "sent":
            summary["sent"] += 1
        elif result == "failed":
            # Cần xem lại: max_attempts đạt → failed, chưa → retry
            async with AsyncSessionLocal() as db2:
                fresh = await db2.get(OutboxEvent, ev.id)
                if fresh and fresh.status == "failed":
                    summary["failed"] += 1
                else:
                    summary["retry"] += 1
        elif result == "dlq":
            summary["dlq"] += 1
        elif result == "skipped":
            summary["skipped"] += 1

    return summary


async def outbox_worker_loop(stop_event: asyncio.Event, interval_sec: int = WORKER_INTERVAL_SEC):
    """Background loop. Chạy mỗi interval_sec giây."""
    logger.info(f"Outbox worker started (interval={interval_sec}s)")
    while not stop_event.is_set():
        try:
            summary = await run_outbox_worker_once()
            if summary["fetched"] > 0:
                logger.info(
                    f"Outbox: fetched={summary['fetched']} "
                    f"sent={summary['sent']} retry={summary['retry']} "
                    f"failed={summary['failed']} dlq={summary['dlq']} "
                    f"skipped={summary['skipped']}"
                )
        except Exception as e:
            logger.error(f"Outbox loop error: {e}", exc_info=True)

        try:
            await asyncio.wait_for(stop_event.wait(), timeout=interval_sec)
        except asyncio.TimeoutError:
            pass

    logger.info("Outbox worker stopped")
