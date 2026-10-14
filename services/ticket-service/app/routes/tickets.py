# SPDX-License-Identifier: Apache-2.0
# DX-FSM Ticket Service – Ticket Routes

import httpx
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, field_validator

from app.db.database import get_db
from app.models.ticket import Ticket, TicketHistory
from app.config import get_settings

settings = get_settings()
router = APIRouter()

# ─── Valid categories / priorities (khớp enum PostgreSQL) ────────────────

VALID_CATEGORIES = {"hardware", "software", "network", "electrical", "other"}
VALID_PRIORITIES = {"low", "medium", "high", "critical"}
SLA_HOURS = {"critical": 4, "high": 24, "medium": 72, "low": 168}


# ─── Request / Response models ───────────────────────────────────────────

class TicketCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=500)
    description: Optional[str] = None  # min_length chỉ khi có giá trị
    category: str = Field(default="other")
    priority: str = Field(default="medium")
    customer_location: Optional[str] = None
    # customer_id/name/email lấy từ JWT — trong demo dùng body
    customer_id: UUID
    customer_name: str
    customer_email: str

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        if v.lower() not in VALID_CATEGORIES:
            raise ValueError(f"category must be one of {VALID_CATEGORIES}")
        return v.lower()

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str) -> str:
        if v.lower() not in VALID_PRIORITIES:
            raise ValueError(f"priority must be one of {VALID_PRIORITIES}")
        return v.lower()


class TicketResponse(BaseModel):
    id: str
    ticket_number: str
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    category: str
    customer_id: str
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    technician_id: Optional[str] = None
    technician_name: Optional[str] = None
    ai_category: Optional[str] = None
    ai_priority: Optional[str] = None
    ai_confidence: Optional[float] = None
    ai_recommendation: Optional[str] = None
    sla_deadline: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    assigned_at: Optional[str] = None

    class Config:
        from_attributes = True


class TicketListResponse(BaseModel):
    items: list[TicketResponse]
    total: int
    limit: int
    offset: int


class AIClassifyResponse(BaseModel):
    category: str
    priority: str
    confidence: float
    recommendation: Optional[str] = None
    method: str = "rule"


# ─── Helpers ───────────────────────────────────────────────────────────────

def _dt_to_str(dt: Optional[datetime]) -> Optional[str]:
    if dt is None:
        return None
    return dt.isoformat()


def _build_ticket_response(ticket: Ticket) -> TicketResponse:
    return TicketResponse(
        id=str(ticket.id),
        ticket_number=ticket.ticket_number,
        title=ticket.title,
        description=ticket.description,
        status=ticket.status,
        priority=ticket.priority,
        category=ticket.category,
        customer_id=str(ticket.customer_id),
        customer_name=ticket.customer_name,
        customer_email=ticket.customer_email,
        technician_id=str(ticket.technician_id) if ticket.technician_id else None,
        technician_name=ticket.technician_name,
        ai_category=ticket.ai_category,
        ai_priority=ticket.ai_priority,
        ai_confidence=float(ticket.ai_confidence) if ticket.ai_confidence else None,
        ai_recommendation=ticket.ai_recommendation,
        sla_deadline=_dt_to_str(ticket.sla_deadline),
        created_at=_dt_to_str(ticket.created_at),
        updated_at=_dt_to_str(ticket.updated_at),
        assigned_at=_dt_to_str(ticket.assigned_at),
    )


async def _call_ai_classify(title: str, description: str) -> AIClassifyResponse:
    """Gọi ai-service /classify. Fallback rule-based nếu ai-service down."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{settings.ai_service_url}/classify",
                json={"title": title, "description": description or ""},
            )
            resp.raise_for_status()
            data = resp.json()
            return AIClassifyResponse(**data)
    except Exception:
        # AI unavailable → rule-based fallback cứng
        return AIClassifyResponse(
            category="other",
            priority="medium",
            confidence=0.0,
            recommendation="AI unavailable – please review manually.",
            method="fallback",
        )


async def _dispatch_n8n_webhook(ticket_id: UUID, ticket_number: str):
    """Gọi n8n webhook khi ticket được tạo. Fail silently."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                f"{settings.n8n_webhook_url}/ticket-created",
                json={"ticket_id": str(ticket_id), "ticket_number": ticket_number},
            )
    except Exception:
        pass  # n8n webhook failure không block ticket creation


# ─── Routes ───────────────────────────────────────────────────────────────

@router.get("", response_model=TicketListResponse)
async def list_tickets(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    technician_id: Optional[UUID] = None,
    customer_id: Optional[UUID] = None,
    q: Optional[str] = None,
    mine: bool = False,
    limit: int = Field(default=20, le=100),
    offset: int = 0,
    sort_by: Optional[str] = "created_at",
    sort_dir: Optional[str] = "desc",
    db: AsyncSession = Depends(get_db),
):
    # Count total
    count_q = select(func.count(Ticket.id))
    query = select(Ticket)

    if status:
        count_q = count_q.where(Ticket.status == status)
        query = query.where(Ticket.status == status)
    if priority:
        count_q = count_q.where(Ticket.priority == priority)
        query = query.where(Ticket.priority == priority)
    if category:
        count_q = count_q.where(Ticket.category == category)
        query = query.where(Ticket.category == category)
    if technician_id:
        count_q = count_q.where(Ticket.technician_id == technician_id)
        query = query.where(Ticket.technician_id == technician_id)
    if customer_id:
        count_q = count_q.where(Ticket.customer_id == customer_id)
        query = query.where(Ticket.customer_id == customer_id)
    if q:
        pattern = f"%{q}%"
        count_q = count_q.where(Ticket.title.ilike(pattern))
        query = query.where(Ticket.title.ilike(pattern))
    if mine:
        # customer_id từ JWT header → trong demo dùng query param tạm
        pass

    # Sort
    sort_col = {"created_at": Ticket.created_at, "priority": Ticket.priority,
                "sla_deadline": Ticket.sla_deadline}.get(sort_by, Ticket.created_at)
    if sort_dir == "desc":
        query = query.order_by(sort_col.desc())
    else:
        query = query.order_by(sort_col.asc())

    # Total
    total_result = await db.execute(count_q)
    total = total_result.scalar() or 0

    # Paginate
    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    tickets = result.scalars().all()

    return TicketListResponse(
        items=[_build_ticket_response(t) for t in tickets],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/stats/summary")
async def get_stats(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import func as f

    rows = await db.execute(
        select(
            f.count(Ticket.id).label("total"),
            f.count(Ticket.id).filter(Ticket.status == "new").label("new_count"),
            f.count(Ticket.id).filter(Ticket.status == "assigned").label("assigned_count"),
            f.count(Ticket.id).filter(Ticket.status == "in_progress").label("in_progress_count"),
            f.count(Ticket.id).filter(Ticket.status == "pending").label("pending_count"),
            f.count(Ticket.id).filter(Ticket.status == "resolved").label("resolved_count"),
            f.count(Ticket.id).filter(Ticket.status == "closed").label("closed_count"),
            f.count(Ticket.id).filter(Ticket.priority == "critical").label("critical_count"),
        )
    )
    row = rows.one()
    return {
        "total": row.total,
        "by_status": {
            "new": row.new_count,
            "assigned": row.assigned_count,
            "in_progress": row.in_progress_count,
            "pending": row.pending_count,
            "resolved": row.resolved_count,
            "closed": row.closed_count,
        },
        "by_priority": {"critical": row.critical_count},
        "open": row.new_count + row.assigned_count + row.in_progress_count + row.pending_count,
        "sla_compliance_pct": None,  # tính sau khi có resolved_at data
    }


@router.get("/overdue")
async def get_overdue(db: AsyncSession = Depends(get_db)):
    rows = await db.execute(
        select(Ticket).where(
            Ticket.sla_deadline < datetime.now(timezone.utc),
            Ticket.status.notin_(["resolved", "closed", "cancelled"]),
        ).order_by(Ticket.sla_deadline.asc())
    )
    tickets = rows.scalars().all()
    return {"items": [_build_ticket_response(t) for t in tickets], "count": len(tickets)}


@router.get("/{ticket_id}", response_model=TicketResponse)
async def get_ticket(ticket_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return _build_ticket_response(ticket)


@router.post("", response_model=TicketResponse, status_code=201)
async def create_ticket(
    ticket_data: TicketCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    # 1. Generate ticket number
    year = datetime.now().year
    result = await db.execute(
        text("""
            SELECT ticket_number FROM tickets
            WHERE ticket_number LIKE :prefix
            ORDER BY ticket_number DESC
            LIMIT 1
        """),
        {"prefix": f"TKT-{year}-%"},
    )
    last = result.scalar()
    if last:
        seq = int(last.split("-")[-1]) + 1
    else:
        seq = 1
    ticket_number = f"TKT-{year}-{seq:06d}"

    # 2. SLA deadline
    sla_hours = SLA_HOURS.get(ticket_data.priority, 168)
    sla_deadline = datetime.now(timezone.utc).replace(microsecond=0)
    from datetime import timedelta
    sla_deadline = sla_deadline + timedelta(hours=sla_hours)

    # 3. AI classify (parallel, không block ticket creation)
    ai_result = await _call_ai_classify(ticket_data.title, ticket_data.description or "")
    ai_category = ai_result.category
    ai_priority = ai_result.priority
    ai_confidence = ai_result.confidence
    ai_recommendation = ai_result.recommendation

    # 4. Insert ticket
    ticket = Ticket(
        ticket_number=ticket_number,
        title=ticket_data.title,
        description=ticket_data.description,
        category=ai_category or ticket_data.category,
        priority=ai_priority or ticket_data.priority,
        status="new",
        customer_id=ticket_data.customer_id,
        customer_name=ticket_data.customer_name,
        customer_email=ticket_data.customer_email,
        customer_location=ticket_data.customer_location,
        sla_deadline=sla_deadline,
        ai_category=ai_category,
        ai_priority=ai_priority,
        ai_confidence=ai_confidence,
        ai_recommendation=ai_recommendation,
    )
    db.add(ticket)
    await db.flush()  # lấy id trước commit

    # 5. Write history
    history = TicketHistory(
        ticket_id=ticket.id,
        user_id=ticket_data.customer_id,
        action="created",
        new_value=f"Ticket {ticket_number} created",
    )
    db.add(history)

    await db.commit()
    await db.refresh(ticket)

    # 6. Dispatch n8n webhook (background, non-blocking)
    background_tasks.add_task(
        _dispatch_n8n_webhook, ticket.id, ticket.ticket_number
    )

    return _build_ticket_response(ticket)
