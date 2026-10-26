# SPDX-License-Identifier: Apache-2.0
"""
DX-FSM AI Service — Recommender domain models (A5.3)
Technician profiles + performance metrics + ticket history.
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field


@dataclass
class TechnicianProfile:
    """KTV profile với skills, level, availability."""
    id: str
    name: str
    employee_code: str
    specialties: list[str] = field(default_factory=list)  # categories: hardware, software, ...
    skills: list[str] = field(default_factory=list)  # specific: ['windows', 'cisco', 'aws']
    level: int = 1  # 1=junior, 2=mid, 3=senior, 4=lead
    shift: str = "business_hours"  # "business_hours" | "extended" | "oncall"
    active: bool = True

    def has_specialty(self, category: str) -> bool:
        return category in self.specialties

    def has_skill(self, skill: str) -> bool:
        return skill.lower() in [s.lower() for s in self.skills]


@dataclass
class PerformanceMetrics:
    """Aggregated performance cho technician."""
    technician_id: str
    total_resolved: int = 0
    total_assigned: int = 0
    avg_resolution_hours: float = 0.0
    avg_satisfaction: float = 0.0  # 1-5 stars
    last_30d_resolved: int = 0
    last_30d_satisfaction: float = 0.0
    category_breakdown: dict[str, int] = field(default_factory=dict)  # category → count
    updated_at: float = field(default_factory=time.time)

    @property
    def resolution_rate(self) -> float:
        """Tỉ lệ resolved / assigned (0-1)."""
        if self.total_assigned == 0:
            return 0.0
        return min(1.0, self.total_resolved / self.total_assigned)

    @property
    def satisfaction_norm(self) -> float:
        """Satisfaction normalized to 0-1 (5 stars → 1.0)."""
        return self.avg_satisfaction / 5.0

    @property
    def recent_load(self) -> int:
        """Tickets resolved trong 30 ngày qua — proxy for experience."""
        return self.last_30d_resolved

    @property
    def category_expertise(self) -> dict[str, float]:
        """% of resolved tickets in each category (0-1)."""
        if not self.total_resolved:
            return {}
        return {
            cat: count / self.total_resolved
            for cat, count in self.category_breakdown.items()
        }


@dataclass
class TicketContext:
    """Context cho recommendation request."""
    ticket_id: str
    title: str
    description: str = ""
    category: str = "other"
    priority: str = "medium"
    estimated_hours: float = 1.0
    required_skills: list[str] = field(default_factory=list)


@dataclass
class Recommendation:
    """Single recommendation result."""
    technician: TechnicianProfile
    score: float  # 0-100
    confidence: float  # 0-1
    reasons: list[str] = field(default_factory=list)
    workload: int = 0  # current open tickets
    estimated_pickup_hours: float = 0.0

    def to_dict(self) -> dict:
        return {
            "technician_id": self.technician.id,
            "technician_name": self.technician.name,
            "employee_code": self.technician.employee_code,
            "specialty": self.technician.specialties,
            "level": self.technician.level,
            "score": round(self.score, 2),
            "confidence": round(self.confidence, 3),
            "reasons": self.reasons,
            "current_workload": self.workload,
            "estimated_pickup_hours": round(self.estimated_pickup_hours, 2),
        }
