# SPDX-License-Identifier: Apache-2.0
# DX-FSM Ticket Service – Notifications API (của người dùng hiện tại)
#   GET   /notifications?is_read=&limit=&offset=
#   PATCH /notifications/{id}/read
#   POST  /notifications/mark-all-read

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import TokenUser, get_current_user
from app.db.database import get_db
from app.models.notification import Notification
from app.models.ticket import Ticket
from app.services.user_resolver import resolve_or_create_user

router = APIRouter()


def _item(n: Notification, ticket_number: Optional[str]) -> dict:
    return {
        "id": str(n.id),
        "user_id": str(n.user_id),
        "title": n.title,
        "message": n.message or "",
        "type": n.type or "info",
        "is_read": bool(n.is_read),
        "ticket_id": str(n.related_ticket_id) if n.related_ticket_id else None,
        "ticket_number": ticket_number,
        "created_at": n.created_at.isoformat() if n.created_at else None,
        "read_at": None,
    }


@router.get("/notifications")
async def list_notifications(
    is_read: Optional[bool] = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user: TokenUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    me = await resolve_or_create_user(db, user)
    if me is None:
        return {"items": [], "total": 0, "unread_count": 0, "limit": limit, "offset": offset}

    where = [Notification.user_id == me]
    if is_read is not None:
        where.append(Notification.is_read.is_(is_read))

    total = (await db.execute(select(func.count(Notification.id)).where(*where))).scalar() or 0
    unread = (
        await db.execute(
            select(func.count(Notification.id)).where(Notification.user_id == me, Notification.is_read.is_(False))
        )
    ).scalar() or 0
    rows = await db.execute(
        select(Notification, Ticket.ticket_number)
        .outerjoin(Ticket, Ticket.id == Notification.related_ticket_id)
        .where(*where)
        .order_by(Notification.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return {
        "items": [_item(n, num) for n, num in rows.all()],
        "total": total,
        "unread_count": unread,
        "limit": limit,
        "offset": offset,
    }


@router.patch("/notifications/{notification_id}/read")
async def mark_read(
    notification_id: UUID,
    user: TokenUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    me = await resolve_or_create_user(db, user)
    result = await db.execute(
        update(Notification)
        .where(Notification.id == notification_id, Notification.user_id == me)
        .values(is_read=True)
        .returning(Notification.id)
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    await db.commit()
    return {"id": str(notification_id), "is_read": True, "read_at": datetime.now(timezone.utc).isoformat()}


@router.post("/notifications/mark-all-read")
async def mark_all_read(
    user: TokenUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    me = await resolve_or_create_user(db, user)
    result = await db.execute(
        update(Notification)
        .where(Notification.user_id == me, Notification.is_read.is_(False))
        .values(is_read=True)
    )
    await db.commit()
    return {"marked": result.rowcount or 0}
