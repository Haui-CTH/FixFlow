"""
DX-FSM AI Service — Recommender scorer (A5.3)
Multi-factor scoring: skill match + workload + performance + recency.
"""
from __future__ import annotations

import math
from typing import Optional

from .recommender_models import (
    TechnicianProfile,
    PerformanceMetrics,
    TicketContext,
    Recommendation,
)


# ─── Weights (tunable) ───────────────────────────────

W_SPECIALTY = 40.0
W_SKILL = 15.0
W_PERFORMANCE = 20.0
W_WORKLOAD = 15.0
W_LEVEL = 5.0
W_RECENCY = 5.0

# Max workload threshold (above which, score = 0)
MAX_WORKLOAD = 8
# Priority multiplier on workload penalty
PRIORITY_MULT = {"critical": 1.5, "high": 1.2, "medium": 1.0, "low": 0.7}


def _specialty_score(tech: TechnicianProfile, ticket: TicketContext) -> tuple[float, str]:
    """Score 0-1 based on category match."""
    if tech.has_specialty(ticket.category):
        return 1.0, f"chuyên môn {ticket.category}"
    return 0.0, ""


def _skill_score(tech: TechnicianProfile, ticket: TicketContext) -> tuple[float, list[str]]:
    """Score 0-1 based on required skills match."""
    if not ticket.required_skills:
        return 0.5, []  # neutral if no skills specified
    matched = [s for s in ticket.required_skills if tech.has_skill(s)]
    if not ticket.required_skills:
        return 0.5, []
    score = len(matched) / len(ticket.required_skills)
    return score, matched


def _performance_score(metrics: PerformanceMetrics) -> tuple[float, list[str]]:
    """Score 0-1 from resolution rate, satisfaction, recent activity."""
    if metrics.total_resolved == 0:
        return 0.0, []  # no history
    parts = []
    # Resolution rate (0-1)
    rr = metrics.resolution_rate
    parts.append(rr * 0.4)
    # Satisfaction (0-1)
    parts.append(metrics.satisfaction_norm * 0.4)
    # Recent activity bonus (more recent resolved = more experienced/active)
    recent_factor = min(1.0, math.log1p(metrics.recent_load) / math.log1p(50))
    parts.append(recent_factor * 0.2)
    return sum(parts), [
        f"tỉ lệ xử lý {rr*100:.0f}%",
        f"đánh giá {metrics.avg_satisfaction:.1f}/5",
        f"{metrics.recent_load} ticket 30 ngày qua",
    ]


def _workload_score(
    tech: TechnicianProfile,
    metrics: PerformanceMetrics,
    ticket: TicketContext,
    current_open: int = 0,
) -> tuple[float, str]:
    """
    Score 0-1 — càng ít việc càng tốt.
    Higher priority → workload penalty lớn hơn.
    """
    workload = current_open if current_open > 0 else max(0, metrics.total_assigned - metrics.total_resolved)
    prio_mult = PRIORITY_MULT.get(ticket.priority, 1.0)
    effective_max = MAX_WORKLOAD / prio_mult
    if workload >= effective_max:
        return 0.0, f"đang bận ({workload} ticket)"
    score = max(0.0, 1.0 - (workload / effective_max))
    return score, f"workload {workload}/{MAX_WORKLOAD}"


def _level_score(tech: TechnicianProfile, ticket: TicketContext) -> tuple[float, str]:
    """Senior cho critical/high; junior OK cho low."""
    if ticket.priority in ("critical", "high") and tech.level >= 3:
        return 1.0, f"level {tech.level} (senior)"
    if ticket.priority == "medium" and tech.level >= 2:
        return 0.8, f"level {tech.level}"
    if ticket.priority == "low" and tech.level >= 1:
        return 0.6, f"level {tech.level}"
    return 0.4, f"level {tech.level}"


def _recency_score(metrics: PerformanceMetrics) -> float:
    """Recent activity boost (0-1)."""
    return min(1.0, math.log1p(metrics.recent_load) / math.log1p(30))


def score_technician(
    tech: TechnicianProfile,
    metrics: PerformanceMetrics,
    ticket: TicketContext,
    current_open: int = 0,
) -> Recommendation:
    """
    Compute recommendation score for one technician.

    Returns Recommendation với score 0-100, confidence 0-1, reasons.
    """
    if not tech.active:
        return Recommendation(
            technician=tech,
            score=0.0,
            confidence=0.0,
            reasons=["KTV không active"],
            workload=current_open,
        )

    # Factor scores (0-1)
    spec_s, spec_r = _specialty_score(tech, ticket)
    skill_s, skill_matches = _skill_score(tech, ticket)
    perf_s, perf_reasons = _performance_score(metrics)
    wl_s, wl_r = _workload_score(tech, metrics, ticket, current_open)
    lvl_s, lvl_r = _level_score(tech, ticket)
    rec_s = _recency_score(metrics)

    # Weighted sum (each factor 0-1, weights 0-100 scale)
    raw = (
        spec_s * W_SPECIALTY
        + skill_s * W_SKILL
        + perf_s * W_PERFORMANCE
        + wl_s * W_WORKLOAD
        + lvl_s * W_LEVEL
        + rec_s * W_RECENCY
    )

    # Specialty is a hard requirement (multiplier penalty nếu không match)
    if spec_s == 0:
        # Không có specialty → giảm 50% nhưng vẫn có thể recommend nếu workload thấp
        raw *= 0.5

    # Critical priority → specialty + workload quan trọng hơn
    if ticket.priority == "critical" and spec_s == 0:
        raw *= 0.3  # severe penalty
    if ticket.priority == "critical" and wl_s < 0.3:
        raw *= 0.5  # critical + busy = bad

    score = min(100.0, max(0.0, raw))

    # Confidence: dựa trên data quality
    confidence = 0.0
    if metrics.total_resolved >= 5:
        confidence += 0.4
    elif metrics.total_resolved >= 1:
        confidence += 0.2
    if tech.level >= 2:
        confidence += 0.2
    if spec_s == 1.0:
        confidence += 0.3
    if ticket.required_skills and skill_matches:
        confidence += 0.1
    confidence = min(1.0, confidence)

    # Build reasons
    reasons: list[str] = []
    if spec_r:
        reasons.append(f"Có {spec_r}")
    if skill_matches:
        reasons.append(f"Kỹ năng phù hợp: {', '.join(skill_matches)}")
    reasons.extend(perf_reasons)
    if wl_r:
        reasons.append(wl_r)
    if lvl_r:
        reasons.append(lvl_r)
    if not reasons:
        reasons = ["KTV khả dụng"]

    # Estimated pickup hours (càng ít workload càng nhanh)
    if current_open > 0:
        est_pickup = current_open * 2.0
    else:
        est_pickup = 1.0 if wl_s > 0.5 else 4.0

    return Recommendation(
        technician=tech,
        score=score,
        confidence=confidence,
        reasons=reasons,
        workload=current_open,
        estimated_pickup_hours=est_pickup,
    )
