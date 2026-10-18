# SPDX-License-Identifier: Apache-2.0
"""DX-FSM Ticket Service – Outbox DLQ dispatcher (A5.4)

Sau khi event fail permanently, move sang DLQ table.
Admin có thể list/retry/discard qua API.
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import AsyncSessionLocal
from app.models.outbox import OutboxEvent
from app.models.outbox_dlq import OutboxDLQ

logger = logging.getLogger(__name__)


async def move_to_dlq(db: AsyncSession, event: OutboxEvent) -> OutboxDLQ:
    """
    Move failed event sang DLQ table. Không xóa event gốc (giữ audit).
    """
    dlq_entry = OutboxDLQ(
        id=uuid.uuid4(),
        original_event_id=event.id,
        event_type=event.event_type,
        payload=event.payload,
        last_error=event.last_error,
        total_attempts=event.attempts,
        moved_to_dlq_at=datetime.now(timezone.utc),
        resolved="pending",
    )
    db.add(dlq_entry)
    await db.flush()
    logger.warning(
        f"Moved event {event.id} ({event.event_type}) to DLQ "
        f"after {event.attempts} attempts"
    )
    return dlq_entry


async def list_dlq(
    db: AsyncSession,
    resolved: Optional[str] = None,
    event_type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> list[OutboxDLQ]:
    """List DLQ entries với filter."""
    stmt = select(OutboxDLQ).order_by(OutboxDLQ.moved_to_dlq_at.desc())
    if resolved:
        stmt = stmt.where(OutboxDLQ.resolved == resolved)
    if event_type:
        stmt = stmt.where(OutboxDLQ.event_type == event_type)
    stmt = stmt.limit(limit).offset(offset)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def count_dlq(db: AsyncSession, resolved: Optional[str] = None) -> int:
    """Count DLQ entries."""
    from sqlalchemy import func
    stmt = select(func.count()).select_from(OutboxDLQ)
    if resolved:
        stmt = stmt.where(OutboxDLQ.resolved == resolved)
    result = await db.execute(stmt)
    return result.scalar() or 0


async def retry_dlq_entry(
    db: AsyncSession,
    dlq_id: uuid.UUID,
    resolved_by: str,
    note: Optional[str] = None,
) -> Optional[OutboxEvent]:
    """
    Retry một DLQ entry: tạo lại OutboxEvent mới với status=pending,
    mark DLQ entry as 'retried'.
    """
    dlq = await db.get(OutboxDLQ, dlq_id)
    if not dlq:
        return None
    if dlq.resolved != "pending":
        logger.warning(f"DLQ {dlq_id} already resolved={dlq.resolved}")
        return None
    # Tạo OutboxEvent mới (giữ audit trail)
    new_event = OutboxEvent(
        id=uuid.uuid4(),
        event_type=dlq.event_type,
        payload=dlq.payload,
        status="pending",
        attempts=0,
        next_retry_at=datetime.now(timezone.utc),
    )
    db.add(new_event)
    # Update DLQ entry
    dlq.resolved = "retried"
    dlq.resolved_at = datetime.now(timezone.utc)
    dlq.resolved_by = resolved_by
    dlq.resolution_note = note
    await db.flush()
    logger.info(
        f"DLQ {dlq_id} retried as new event {new_event.id} by {resolved_by}"
    )
    return new_event


async def discard_dlq_entry(
    db: AsyncSession,
    dlq_id: uuid.UUID,
    resolved_by: str,
    note: Optional[str] = None,
) -> bool:
    """Mark DLQ entry as discarded (không retry)."""
    dlq = await db.get(OutboxDLQ, dlq_id)
    if not dlq:
        return False
    if dlq.resolved != "pending":
        return False
    dlq.resolved = "discarded"
    dlq.resolved_at = datetime.now(timezone.utc)
    dlq.resolved_by = resolved_by
    dlq.resolution_note = note
    await db.flush()
    logger.info(f"DLQ {dlq_id} discarded by {resolved_by}")
    return True


async def cleanup_old_dlq(db: AsyncSession, days: int = 30) -> int:
    """Xóa DLQ entries đã resolved > N ngày. Returns count deleted."""
    cutoff = datetime.now(timezone.utc).timestamp() - (days * 86400)
    stmt = (
        delete(OutboxDLQ)
        .where(OutboxDLQ.resolved.in_(["retried", "discarded"]))
        .where(OutboxDLQ.resolved_at.isnot(None))
    )
    result = await db.execute(stmt)
    return result.rowcount
