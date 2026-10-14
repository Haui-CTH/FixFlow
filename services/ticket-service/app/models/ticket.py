# SPDX-License-Identifier: Apache-2.0
# DX-FSM Ticket Service – Ticket Models

from datetime import datetime
from uuid import UUID
from typing import Optional
from sqlalchemy import Column, String, Text, Enum, ForeignKey, DateTime, Numeric, Boolean, ARRAY, BigInteger
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB
from sqlalchemy.sql import func

from app.db.database import Base


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=func.gen_random_uuid())
    ticket_number = Column(String(20), unique=True, nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    category = Column(String(50), nullable=False, default="other")
    priority = Column(String(20), nullable=False, default="medium")
    status = Column(String(50), nullable=False, default="new")

    customer_id = Column(PGUUID(as_uuid=True), nullable=False)
    customer_name = Column(String(255))
    customer_email = Column(String(255))
    customer_phone = Column(String(50))
    customer_location = Column(String(255))

    technician_id = Column(PGUUID(as_uuid=True))
    technician_name = Column(String(255))

    ai_category = Column(String(100))
    ai_priority = Column(String(50))
    ai_confidence = Column(Numeric(5, 2))
    ai_recommendation = Column(Text)

    sla_deadline = Column(DateTime(timezone=True))
    sla_met = Column(Boolean)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    assigned_at = Column(DateTime(timezone=True))
    started_at = Column(DateTime(timezone=True))
    resolved_at = Column(DateTime(timezone=True))
    closed_at = Column(DateTime(timezone=True))
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class TicketComment(Base):
    __tablename__ = "ticket_comments"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=func.gen_random_uuid())
    ticket_id = Column(PGUUID(as_uuid=True), ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(PGUUID(as_uuid=True), nullable=False)
    content = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class TicketAttachment(Base):
    __tablename__ = "ticket_attachments"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=func.gen_random_uuid())
    ticket_id = Column(PGUUID(as_uuid=True), ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(PGUUID(as_uuid=True), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    file_size = Column(BigInteger)
    mime_type = Column(String(100))
    minio_object_name = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TicketHistory(Base):
    __tablename__ = "ticket_history"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=func.gen_random_uuid())
    ticket_id = Column(PGUUID(as_uuid=True), ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(PGUUID(as_uuid=True))
    action = Column(String(100), nullable=False)
    old_value = Column(Text)
    new_value = Column(Text)
    metadata = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
