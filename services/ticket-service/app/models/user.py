# SPDX-License-Identifier: Apache-2.0
# DX-FSM Ticket Service – User Models

from sqlalchemy import Column, String, Boolean, DateTime, ARRAY, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.sql import func

from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=func.gen_random_uuid())
    keycloak_id = Column(String(255), unique=True, nullable=False)
    username = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255))
    role = Column(String(50), nullable=False)
    avatar_url = Column(String(500))
    phone = Column(String(50))
    department = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Technician(Base):
    __tablename__ = "technicians"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=func.gen_random_uuid())
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    employee_code = Column(String(50), unique=True)
    specialty = Column(ARRAY(String))
    experience_years = Column(Integer, default=0)
    max_concurrent_tickets = Column(Integer, default=5)
    current_load = Column(Integer, default=0)
    is_available = Column(Boolean, default=True)
    location = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
