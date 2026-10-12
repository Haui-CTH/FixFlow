# SPDX-License-Identifier: Apache-2.0
# DX-FSM AI Service – Technician Recommendation

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class RecommendRequest(BaseModel):
    ticket_id: str
    category: str
    priority: str


class RecommendResponse(BaseModel):
    technician_id: str
    technician_name: str
    employee_code: str
    specialty: list[str]
    score: float
    reason: str


TECHNICIANS = [
    {"id": "tech-001", "name": "Trần Văn Kỹ Thuật", "code": "TECH001", "specialty": ["hardware", "electrical"]},
    {"id": "tech-002", "name": "Lê Thị Bảo Trì", "code": "TECH002", "specialty": ["software", "network"]},
    {"id": "tech-003", "name": "Phạm Minh Hùng", "code": "TECH003", "specialty": ["network", "hardware"]},
]


def rule_based_recommend(category: str, priority: str) -> RecommendResponse:
    # Match by specialty
    matched = [t for t in TECHNICIANS if category in t["specialty"]]
    if not matched:
        matched = TECHNICIANS

    tech = matched[0]
    return RecommendResponse(
        technician_id=tech["id"],
        technician_name=tech["name"],
        employee_code=tech["code"],
        specialty=tech["specialty"],
        score=85.0,
        reason=f"KTV có chuyên môn về {category}",
    )


@router.get("", response_model=RecommendResponse)
async def recommend_technician(ticket_id: str, category: str = "other", priority: str = "medium"):
    return rule_based_recommend(category, priority)
