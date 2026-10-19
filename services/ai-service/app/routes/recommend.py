# SPDX-License-Identifier: Apache-2.0
"""DX-FSM AI Service – Technician Recommendation v2 (A5.3)
Multi-factor scoring + collaborative filtering."""

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field
from pathlib import Path

from app.services.recommender_v2 import (
    TicketRecord,
    get_recommender,
    reset_recommender,
)
from app.services.recommender_models import (
    TechnicianProfile,
    TicketContext,
)

router = APIRouter()


# ─── Request/Response models ─────────────────────────

class RecommendRequest(BaseModel):
    ticket_id: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1, max_length=300)
    description: str = Field("", max_length=5000)
    category: str = Field("other", max_length=50)
    priority: str = Field("medium", max_length=20)
    estimated_hours: float = Field(1.0, ge=0, le=1000)
    required_skills: list[str] = Field(default_factory=list)


class TechnicianRec(BaseModel):
    technician_id: str
    technician_name: str
    employee_code: str
    specialty: list[str]
    level: int
    score: float
    confidence: float
    reasons: list[str]
    current_workload: int
    estimated_pickup_hours: float


class RecommendResponse(BaseModel):
    ticket_id: str
    recommendations: list[TechnicianRec]
    total_technicians: int


class FeedbackRequest(BaseModel):
    """Feedback sau khi ticket resolved — dùng để cập nhật metrics."""
    ticket_id: str
    technician_id: str
    category: str
    resolution_hours: float = 0.0
    satisfaction: int = Field(0, ge=0, le=5)


# ─── Routes ──────────────────────────────────────────

@router.post("", response_model=RecommendResponse)
async def recommend_technicians(req: RecommendRequest):
    """
    Recommend top technicians cho một ticket.

    Multi-factor scoring:
      - Specialty match (40%)
      - Skill coverage (15%)
      - Performance history (20%)
      - Workload (15%)
      - Level (5%)
      - Recency (5%)
      - Collaborative filter boost
    """
    rec = get_recommender()
    ticket = TicketContext(
        ticket_id=req.ticket_id,
        title=req.title,
        description=req.description,
        category=req.category,
        priority=req.priority,
        estimated_hours=req.estimated_hours,
        required_skills=req.required_skills,
    )
    recs = rec.recommend(ticket, top_k=3)
    return RecommendResponse(
        ticket_id=req.ticket_id,
        recommendations=[TechnicianRec(**r.to_dict()) for r in recs],
        total_technicians=len(rec.all_profiles()),
    )


@router.get("", response_model=RecommendResponse)
async def recommend_technicians_get(
    ticket_id: str = Query(..., min_length=1),
    title: str = Query(..., min_length=1, max_length=300),
    category: str = Query("other"),
    priority: str = Query("medium"),
    description: str = Query("", max_length=5000),
):
    """GET wrapper for simple recommendation (e.g., curl/test)."""
    req = RecommendRequest(
        ticket_id=ticket_id,
        title=title,
        description=description,
        category=category,
        priority=priority,
    )
    return await recommend_technicians(req)


@router.post("/feedback", response_model=dict)
async def submit_feedback(feedback: FeedbackRequest):
    """Submit feedback after ticket resolved — update metrics."""
    rec = get_recommender()
    rec.increment_resolved(
        tech_id=feedback.technician_id,
        category=feedback.category,
        resolution_hours=feedback.resolution_hours,
        satisfaction=feedback.satisfaction,
    )
    rec.add_history(TicketRecord(
        ticket_id=feedback.ticket_id,
        technician_id=feedback.technician_id,
        category=feedback.category,
        priority="medium",
        title=feedback.ticket_id,
        resolution_hours=feedback.resolution_hours,
        satisfaction=feedback.satisfaction,
    ))
    return {"status": "ok", "technician_id": feedback.technician_id}


@router.post("/workload", response_model=dict)
async def set_workload(tech_id: str = Query(...), open_count: int = Query(..., ge=0)):
    """Update current open ticket count for a technician."""
    rec = get_recommender()
    rec.set_open_count(tech_id, open_count)
    return {"technician_id": tech_id, "open_count": open_count}


@router.post("/reset", response_model=dict)
async def reset_and_seed():
    """Reset recommender + reload seed data."""
    import json
    reset_recommender()
    rec = get_recommender()
    data_dir = Path(__file__).parent.parent / "data"

    profiles_path = data_dir / "recommender_seed.json"
    history_path = data_dir / "recommender_history_seed.json"
    records_path = data_dir / "recommender_history_records.json"

    n_profiles = 0
    n_history = 0

    if profiles_path.exists():
        profiles_data = json.loads(profiles_path.read_text(encoding="utf-8"))
        rec.add_profiles([TechnicianProfile(**p) for p in profiles_data])
        n_profiles = len(profiles_data)

    if history_path.exists():
        h_data = json.loads(history_path.read_text(encoding="utf-8"))
        for tid, m in h_data.get("metrics", {}).items():
            rec.update_metrics(tech_id=tid, **m)
        for tid, cnt in h_data.get("open_counts", {}).items():
            rec.set_open_count(tid, cnt)

    if records_path.exists():
        r_data = json.loads(records_path.read_text(encoding="utf-8"))
        records = [TicketRecord(**r) for r in r_data]
        rec.add_history_many(records)
        n_history = len(records)

    return {
        "status": "seeded",
        "profiles": n_profiles,
        "history_records": n_history,
    }


@router.get("/profiles", response_model=list[dict])
async def list_profiles():
    """List all technician profiles."""
    rec = get_recommender()
    return [
        {
            **p.__dict__,
            "metrics": rec._metrics.get(p.id).__dict__ if rec._metrics.get(p.id) else None,
        }
        for p in rec.all_profiles()
    ]
