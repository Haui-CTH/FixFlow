# SPDX-License-Identifier: Apache-2.0
# DX-FSM Ticket Service – Notification model (bảng notifications trong init.sql)

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.sql import func

from app.db.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=func.gen_random_uuid())
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text)
    type = Column(String(50), default="info")
    is_read = Column(Boolean, default=False)
    related_ticket_id = Column(PGUUID(as_uuid=True), ForeignKey("tickets.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
