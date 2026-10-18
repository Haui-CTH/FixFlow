# SPDX-License-Identifier: Apache-2.0
# DX-FSM Ticket Service – Outbox Dead-Letter Queue Model
# Lưu trữ các event đã fail permanently (>max_attempts) để admin xem lại.

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Integer, Text, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.db.database import Base


class OutboxDLQ(Base):
    """
    Dead-letter queue cho outbox events.

    Khi event status='failed' sau max_attempts, move sang DLQ để:
      - Admin xem lại
      - Manual retry
      - Discard nếu không cần thiết
    """

    __tablename__ = "outbox_dlq"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    original_event_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    event_type = Column(String(64), nullable=False)
    payload = Column(JSONB, nullable=False)
    last_error = Column(Text, nullable=True)
    total_attempts = Column(Integer, nullable=False, default=0)

    moved_to_dlq_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # A5.4: thêm trạng thái để admin retry
    resolved = Column(String(16), nullable=False, default="pending")
    # pending | retried | discarded
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolved_by = Column(String(100), nullable=True)
    resolution_note = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        Index("ix_outbox_dlq_resolved_moved", "resolved", "moved_to_dlq_at"),
    )
