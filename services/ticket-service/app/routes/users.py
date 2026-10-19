# SPDX-License-Identifier: Apache-2.0
# DX-FSM Ticket Service – User Routes

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import TokenUser, get_current_user
from app.db.database import get_db
from app.models.ticket import Ticket
from app.models.user import Technician, User
from app.services.user_resolver import resolve_or_create_user

router = APIRouter()

# Ticket còn đang xử lý = tính vào tải của KTV
ACTIVE_STATUSES = ("assigned", "in_progress", "pending")


@router.get("/me")
async def get_me(
    user: TokenUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Người dùng hiện tại: id trong bảng users và (nếu là KTV) id trong bảng technicians."""
    user_id = await resolve_or_create_user(db, user)
    technician_id = None
    if user_id is not None:
        technician_id = (
            await db.execute(select(Technician.id).where(Technician.user_id == user_id))
        ).scalar_one_or_none()
    return {
        "user_id": str(user_id) if user_id else None,
        "technician_id": str(technician_id) if technician_id else None,
        "username": user.preferred_username,
        "role": user.role,
    }


@router.get("/technicians")
async def list_technicians(
    _: TokenUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Danh sách KTV cho màn phân công; id = technicians.id (khớp tickets.technician_id)."""
    return await _technicians(db)


async def _technicians(db: AsyncSession):
    from sqlalchemy import Text, cast

    load = (
        select(Ticket.technician_id.label("tid"), func.count(Ticket.id).label("n"))
        .where(cast(Ticket.status, Text).in_(ACTIVE_STATUSES))
        .group_by(Ticket.technician_id)
        .subquery()
    )
    rows = await db.execute(
        select(Technician, User.full_name, User.username, func.coalesce(load.c.n, 0))
        .join(User, User.id == Technician.user_id)
        .outerjoin(load, load.c.tid == Technician.id)
        .order_by(User.full_name)
    )
    return [
        {
            "id": str(t.id),
            "user_id": str(t.user_id),
            "full_name": full_name or username,
            "employee_code": t.employee_code,
            "specialty": t.specialty or [],
            "current_load": int(n),
            "max_concurrent_tickets": t.max_concurrent_tickets,
            "is_available": bool(t.is_available),
        }
        for t, full_name, username, n in rows.all()
    ]
