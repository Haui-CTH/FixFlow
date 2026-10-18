# SPDX-License-Identifier: Apache-2.0
# DX-FSM Ticket Service – Admin Routes
# Endpoints chỉ dành cho manager/admin (SLA check, outbox inspection, DLQ).

from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user, TokenUser
from app.db.database import get_db
from app.models.outbox import OutboxEvent
from app.models.outbox_dlq import OutboxDLQ
from app.services.sla_monitor import run_sla_check_once
from app.services.outbox_dispatcher import run_outbox_worker_once
from app.services.alert_dispatcher import trigger_alert_scan_now
from app.services.outbox_metrics import get_metrics
from app.services.outbox_dlq_dispatcher import (
    list_dlq,
    count_dlq,
    retry_dlq_entry,
    discard_dlq_entry,
    cleanup_old_dlq,
)

router = APIRouter()


class SLACheckResponse(BaseModel):
    scanned: int
    breached: int
    dispatched: int
    errors: int


class AlertScanResponse(BaseModel):
    alerted: int
    started_at: str
    finished_at: str
    webhook_configured: bool


class OutboxEventResponse(BaseModel):
    id: str
    event_type: str
    status: str
    attempts: int
    max_attempts: int
    last_error: Optional[str] = None
    next_retry_at: Optional[datetime] = None
    created_at: datetime
    sent_at: Optional[datetime] = None
    payload: dict

    class Config:
        from_attributes = True


# ─── DLQ models (A5.4) ───────────────────────────────────────────────

class DLQEntryResponse(BaseModel):
    id: str
    original_event_id: str
    event_type: str
    payload: dict
    last_error: Optional[str] = None
    total_attempts: int
    moved_to_dlq_at: datetime
    resolved: str
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    resolution_note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DLQListResponse(BaseModel):
    entries: list[DLQEntryResponse]
    total: int
    pending_count: int


class DLQRetryRequest(BaseModel):
    note: Optional[str] = Field(None, max_length=500)


class DLQDiscardRequest(BaseModel):
    note: Optional[str] = Field(None, max_length=500)


class OutboxMetricsResponse(BaseModel):
    total_sent: int
    total_failed: int
    total_retried: int
    total_dlq: int
    avg_latency_ms: float
    consecutive_failures: int
    circuit_open: bool
    uptime_seconds: float
    recent_errors: list[dict]


# ─── POST /admin/sla/check ────────────────────────────────────────────────


@router.post("/admin/sla/check", response_model=SLACheckResponse)
async def trigger_sla_check(user: TokenUser = Depends(get_current_user)):
    """
    Chạy SLA check thủ công. Manager/admin only.

    Returns: {scanned, breached, dispatched, errors}
    """
    if user.role not in ("admin", "manager"):
        raise HTTPException(
            status_code=403,
            detail="Only admin or manager can trigger SLA check",
        )

    summary = await run_sla_check_once()
    return SLACheckResponse(**summary)


# ─── POST /admin/outbox/run ───────────────────────────────────────────────


@router.post("/admin/outbox/run")
async def trigger_outbox_run(user: TokenUser = Depends(get_current_user)):
    """
    Chạy outbox worker thủ công. Manager/admin only.
    Returns: {fetched, sent, retry, failed, skipped}
    """
    if user.role not in ("admin", "manager"):
        raise HTTPException(
            status_code=403,
            detail="Only admin or manager can trigger outbox run",
        )

    summary = await run_outbox_worker_once()
    return summary


# ─── GET /admin/outbox ────────────────────────────────────────────────────


@router.get("/admin/outbox", response_model=list[OutboxEventResponse])
async def list_outbox_events(
    user: TokenUser = Depends(get_current_user),
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
):
    """
    List outbox events để inspect. Manager/admin only.

    Query params:
      - status: pending | sending | sent | failed
      - limit: max 200, default 50
    """
    if user.role not in ("admin", "manager"):
        raise HTTPException(
            status_code=403,
            detail="Only admin or manager can view outbox",
        )

    stmt = select(OutboxEvent).order_by(OutboxEvent.created_at.desc()).limit(limit)
    if status_filter:
        stmt = stmt.where(OutboxEvent.status == status_filter)

    result = await db.execute(stmt)
    events = result.scalars().all()
    return [
        OutboxEventResponse(
            id=str(e.id),
            event_type=e.event_type,
            status=e.status,
            attempts=e.attempts,
            max_attempts=e.max_attempts,
            last_error=e.last_error,
            next_retry_at=e.next_retry_at,
            created_at=e.created_at,
            sent_at=e.sent_at,
            payload=e.payload,
        )
        for e in events
    ]


# ─── POST /admin/alert/scan (B5.3) ──────────────────────────────────────


@router.post("/admin/alert/scan", response_model=AlertScanResponse)
async def trigger_alert_scan(user: TokenUser = Depends(get_current_user)):
    """
    Chạy alert scan thủ công cho failed outbox events. Manager/admin only.

    B5.3: Quét outbox_events status='failed' chưa alert → POST tới
    ALERT_WEBHOOK_URL. Idempotent qua last_alerted_at.
    """
    if user.role not in ("admin", "manager"):
        raise HTTPException(
            status_code=403,
            detail="Only admin or manager can trigger alert scan",
        )

    summary = await trigger_alert_scan_now()
    return AlertScanResponse(**summary)


# ─── GET /admin/outbox/metrics (A5.4) ─────────────────────────────────

@router.get("/admin/outbox/metrics", response_model=OutboxMetricsResponse)
async def get_outbox_metrics(user: TokenUser = Depends(get_current_user)):
    """Xem outbox metrics + circuit breaker status. Manager/admin only."""
    if user.role not in ("admin", "manager"):
        raise HTTPException(403, detail="Admin only")
    snap = get_metrics().snapshot()
    return OutboxMetricsResponse(**snap)


# ─── GET /admin/outbox/dlq (A5.4) ──────────────────────────────────────

@router.get("/admin/outbox/dlq", response_model=DLQListResponse)
async def get_dlq(
    user: TokenUser = Depends(get_current_user),
    resolved: Optional[str] = Query(None, description="Filter: pending|retried|discarded"),
    event_type: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """
    List dead-letter queue entries. Manager/admin only.
    """
    if user.role not in ("admin", "manager"):
        raise HTTPException(403, detail="Admin only")

    entries = await list_dlq(db, resolved=resolved, event_type=event_type, limit=limit)
    total = await count_dlq(db, resolved=None)
    pending = await count_dlq(db, resolved="pending")

    return DLQListResponse(
        entries=[
            DLQEntryResponse(
                id=str(e.id),
                original_event_id=str(e.original_event_id),
                event_type=e.event_type,
                payload=e.payload,
                last_error=e.last_error,
                total_attempts=e.total_attempts,
                moved_to_dlq_at=e.moved_to_dlq_at,
                resolved=e.resolved,
                resolved_at=e.resolved_at,
                resolved_by=e.resolved_by,
                resolution_note=e.resolution_note,
                created_at=e.created_at,
            )
            for e in entries
        ],
        total=total,
        pending_count=pending,
    )


# ─── POST /admin/outbox/dlq/{id}/retry (A5.4) ─────────────────────────

@router.post("/admin/outbox/dlq/{dlq_id}/retry")
async def retry_dlq(
    dlq_id: UUID,
    req: DLQRetryRequest,
    user: TokenUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retry một DLQ entry: tạo lại OutboxEvent, requeue worker.
    Manager/admin only.
    """
    if user.role not in ("admin", "manager"):
        raise HTTPException(403, detail="Admin only")

    new_event = await retry_dlq_entry(db, dlq_id, user.username, req.note)
    if not new_event:
        raise HTTPException(404, detail=f"DLQ entry {dlq_id} not found or already resolved")
    await db.commit()
    return {"status": "retried", "new_event_id": str(new_event.id)}


# ─── POST /admin/outbox/dlq/{id}/discard (A5.4) ──────────────────────

@router.post("/admin/outbox/dlq/{dlq_id}/discard")
async def discard_dlq(
    dlq_id: UUID,
    req: DLQDiscardRequest,
    user: TokenUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Discard một DLQ entry (không retry). Manager/admin only.
    """
    if user.role not in ("admin", "manager"):
        raise HTTPException(403, detail="Admin only")

    ok = await discard_dlq_entry(db, dlq_id, user.username, req.note)
    if not ok:
        raise HTTPException(404, detail=f"DLQ entry {dlq_id} not found or already resolved")
    await db.commit()
    return {"status": "discarded"}


# ─── POST /admin/outbox/dlq/cleanup (A5.4) ────────────────────────────

@router.post("/admin/outbox/dlq/cleanup")
async def cleanup_dlq(
    days: int = Query(30, ge=1, le=365, description="Delete resolved entries older than N days"),
    user: TokenUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Cleanup old resolved DLQ entries (> N days). Manager/admin only.
    """
    if user.role not in ("admin", "manager"):
        raise HTTPException(403, detail="Admin only")
    n = await cleanup_old_dlq(db, days)
    await db.commit()
    return {"deleted": n, "older_than_days": days}
