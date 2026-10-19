# SPDX-License-Identifier: Apache-2.0
# DX-FSM Ticket Service – tạo thông báo trong app (bảng notifications)

from typing import Iterable, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.models.user import Technician, User


# Nhãn tiếng Việt của trạng thái, dùng trong tiêu đề thông báo
STATUS_VI = {
    "new": "Mới",
    "assigned": "Đã giao",
    "in_progress": "Đang xử lý",
    "pending": "Tạm dừng",
    "resolved": "Đã giải quyết",
    "closed": "Đã đóng",
    "cancelled": "Đã huỷ",
}


async def notify_users(
    db: AsyncSession,
    user_ids: Iterable[Optional[UUID]],
    title: str,
    message: str,
    ticket_id: Optional[UUID] = None,
    type: str = "info",
    exclude: Optional[UUID] = None,
) -> int:
    """Thêm thông báo cho từng user (bỏ trùng, bỏ người thực hiện). Chạy cùng transaction của caller."""
    targets = {u for u in user_ids if u is not None and u != exclude}
    for uid in targets:
        db.add(Notification(user_id=uid, title=title, message=message, type=type, related_ticket_id=ticket_id))
    return len(targets)


async def staff_ids(db: AsyncSession, roles: tuple[str, ...] = ("manager", "admin")) -> list[UUID]:
    rows = await db.execute(select(User.id).where(User.role.in_(roles), User.is_active.is_(True)))
    return list(rows.scalars().all())


async def technician_user_id(db: AsyncSession, technician_id: Optional[UUID]) -> Optional[UUID]:
    """tickets.technician_id trỏ tới technicians.id -> users.id của KTV."""
    if technician_id is None:
        return None
    return (await db.execute(select(Technician.user_id).where(Technician.id == technician_id))).scalar_one_or_none()
