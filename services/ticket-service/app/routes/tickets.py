# SPDX-License-Identifier: Apache-2.0
# DX-FSM Ticket Service – Ticket Routes

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from uuid import UUID
from pydantic import BaseModel

from app.db.database import get_db
from app.models.ticket import Ticket

router = APIRouter()


class TicketCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "other"
    priority: str = "medium"
    customer_id: str
    customer_name: str
    customer_email: str
    customer_phone: Optional[str] = None
    customer_location: Optional[str] = None


class TicketResponse(BaseModel):
    id: str
    ticket_number: str
    title: str
    status: str
    priority: str
    category: str
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("", response_model=list[TicketResponse])
async def list_tickets(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    query = select(Ticket).order_by(Ticket.created_at.desc())

    if status:
        query = query.where(Ticket.status == status)
    if priority:
        query = query.where(Ticket.priority == priority)
    if category:
        query = query.where(Ticket.category == category)

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    tickets = result.scalars().all()
    return [TicketResponse.model_validate(t) for t in tickets]


@router.get("/{ticket_id}", response_model=TicketResponse)
async def get_ticket(ticket_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return TicketResponse.model_validate(ticket)


@router.get("/stats/summary")
async def get_stats(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(func.count(Ticket.id)))
    total = result.scalar()

    return {"total": total}


@router.post("")
async def create_ticket(ticket: TicketCreate, db: AsyncSession = Depends(get_db)):
    # Placeholder – full implementation will connect to PostgreSQL
    return {"message": "Ticket created", "ticket_id": "placeholder"}
