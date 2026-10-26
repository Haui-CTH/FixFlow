# SPDX-License-Identifier: Apache-2.0
"""
DX-FSM AI Service — Recommender v2 (A5.3)
Collaborative filtering: tickets giống nhau (title/description) thường
được giao cho cùng KTV. Combined với skill/workload/performance scoring.
"""
from __future__ import annotations

import json
import logging
import threading
import time
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Optional

from .recommender_models import (
    TechnicianProfile,
    PerformanceMetrics,
    TicketContext,
    Recommendation,
)
from .recommender_scorer import score_technician
from .text_vectorizer import (
    build_idf,
    vectorize,
    cosine_similarity,
)

logger = logging.getLogger(__name__)


# ─── Ticket history record ──────────────────────────

@dataclass
class TicketRecord:
    """Historical ticket record cho collaborative filtering."""
    ticket_id: str
    technician_id: str
    category: str
    priority: str
    title: str
    description: str = ""
    resolution_hours: float = 0.0
    satisfaction: int = 0  # 1-5
    resolved: bool = True
    created_at: float = field(default_factory=time.time)

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict) -> "TicketRecord":
        return cls(**d)


class RecommenderV2:
    """
    Recommender với:
      1. Profile lookup (skills, level, shift)
      2. Performance metrics (resolution rate, satisfaction, recency)
      3. Collaborative filter (similar tickets → same KTV)
      4. Multi-factor scoring
    """

    def __init__(self) -> None:
        self._profiles: dict[str, TechnicianProfile] = {}
        self._metrics: dict[str, PerformanceMetrics] = {}
        self._history: list[TicketRecord] = []
        self._open_counts: dict[str, int] = {}  # current open per tech
        self._lock = threading.RLock()
        # For collaborative filter
        self._history_idf: dict[str, float] = {}
        self._history_tokenized: list[list[str]] = []
        self._history_texts: list[str] = []

    # ─── Profile management ──────────────────────────

    def add_profile(self, profile: TechnicianProfile) -> None:
        with self._lock:
            self._profiles[profile.id] = profile
            if profile.id not in self._metrics:
                self._metrics[profile.id] = PerformanceMetrics(technician_id=profile.id)

    def add_profiles(self, profiles: list[TechnicianProfile]) -> None:
        for p in profiles:
            self.add_profile(p)

    def get_profile(self, tech_id: str) -> Optional[TechnicianProfile]:
        return self._profiles.get(tech_id)

    def all_profiles(self) -> list[TechnicianProfile]:
        return list(self._profiles.values())

    # ─── Metrics management ──────────────────────────

    def update_metrics(self, tech_id: str, **kwargs) -> None:
        """Update metrics cho một KTV."""
        with self._lock:
            if tech_id not in self._metrics:
                self._metrics[tech_id] = PerformanceMetrics(technician_id=tech_id)
            m = self._metrics[tech_id]
            for k, v in kwargs.items():
                if hasattr(m, k):
                    setattr(m, k, v)
            m.updated_at = time.time()

    def increment_resolved(
        self,
        tech_id: str,
        category: str,
        resolution_hours: float = 0.0,
        satisfaction: int = 0,
    ) -> None:
        """Increment resolved count + update category breakdown."""
        with self._lock:
            if tech_id not in self._metrics:
                self._metrics[tech_id] = PerformanceMetrics(technician_id=tech_id)
            m = self._metrics[tech_id]
            m.total_resolved += 1
            m.last_30d_resolved += 1
            m.category_breakdown[category] = m.category_breakdown.get(category, 0) + 1
            # Moving average cho resolution time
            if m.total_resolved == 1:
                m.avg_resolution_hours = resolution_hours
            else:
                m.avg_resolution_hours = (
                    m.avg_resolution_hours * 0.8 + resolution_hours * 0.2
                )
            # Moving average cho satisfaction
            if satisfaction > 0:
                if m.avg_satisfaction == 0:
                    m.avg_satisfaction = satisfaction
                else:
                    m.avg_satisfaction = (
                        m.avg_satisfaction * 0.8 + satisfaction * 0.2
                    )
            m.updated_at = time.time()

    def set_open_count(self, tech_id: str, count: int) -> None:
        with self._lock:
            self._open_counts[tech_id] = max(0, count)

    # ─── History management ──────────────────────────

    def add_history(self, record: TicketRecord) -> None:
        with self._lock:
            self._history.append(record)
            # Rebuild TF-IDF
            self._rebuild_history_index()

    def add_history_many(self, records: list[TicketRecord]) -> None:
        with self._lock:
            self._history.extend(records)
            self._rebuild_history_index()

    def _rebuild_history_index(self) -> None:
        """Rebuild collaborative filter index from history."""
        self._history_texts = []
        for r in self._history:
            text = f"{r.title} {r.title} {r.description} {r.category} {r.priority}"
            self._history_texts.append(text)
        if self._history_texts:
            # build_idf tự tokenize chuỗi; không truyền danh sách đã tách từ
            self._history_idf, self._history_tokenized = build_idf(self._history_texts)
        else:
            self._history_idf = {}
            self._history_tokenized = []

    def history_size(self) -> int:
        return len(self._history)

    # ─── Collaborative filter ────────────────────────

    def _collaborative_boost(
        self,
        ticket: TicketContext,
        tech_id: str,
    ) -> tuple[float, list[str]]:
        """
        Score 0-1 dựa trên lịch sử: similar tickets → same KTV.
        Returns (boost, reasons).
        """
        if not self._history:
            return 0.0, []

        # Vectorize current ticket
        q_text = f"{ticket.title} {ticket.title} {ticket.description} {ticket.category} {ticket.priority}"
        q_vec = vectorize(q_text, self._history_idf)
        if not q_vec:
            return 0.0, []

        # Find top-K similar tickets
        sims: list[tuple[float, TicketRecord]] = []
        for rec, text in zip(self._history, self._history_texts):
            d_vec = vectorize(text, self._history_idf)
            sim = cosine_similarity(q_vec, d_vec)
            if sim > 0.1:  # ignore noise
                sims.append((sim, rec))
        sims.sort(key=lambda x: x[0], reverse=True)
        top = sims[:10]

        if not top:
            return 0.0, []

        # Aggregate: weighted score of which KTV handled similar
        tech_scores: dict[str, float] = {}
        for sim, rec in top:
            tech_scores[rec.technician_id] = tech_scores.get(rec.technician_id, 0) + sim

        # If this tech handled the most similar tickets → boost
        if tech_id not in tech_scores:
            return 0.0, []

        total = sum(tech_scores.values())
        if total == 0:
            return 0.0, []

        own_share = tech_scores[tech_id] / total
        # Scale to 0-1 (max 0.4 boost)
        boost = min(0.4, own_share * 0.4)
        reasons = []
        if own_share > 0.3:
            reasons.append(
                f"đã xử lý {sum(1 for s, r in top if r.technician_id == tech_id)}/{len(top)} ticket tương tự"
            )
        return boost, reasons

    # ─── Recommendation ─────────────────────────────

    def recommend(
        self,
        ticket: TicketContext,
        top_k: int = 3,
        min_score: float = 0.0,
    ) -> list[Recommendation]:
        """
        Recommend top-k technicians cho ticket.

        Combine:
          - Skill match (40%)
          - Skill coverage (15%)
          - Performance (20%)
          - Workload (15%)
          - Level (5%)
          - Recency (5%)
          - Collaborative filter boost
        """
        with self._lock:
            if not self._profiles:
                return []
            recs: list[Recommendation] = []
            for tech in self._profiles.values():
                metrics = self._metrics.get(
                    tech.id,
                    PerformanceMetrics(technician_id=tech.id),
                )
                open_count = self._open_counts.get(tech.id, 0)
                rec = score_technician(tech, metrics, ticket, current_open=open_count)
                # Apply collaborative boost
                cf_boost, cf_reasons = self._collaborative_boost(ticket, tech.id)
                rec.score = min(100.0, rec.score + cf_boost * 100.0)
                rec.reasons.extend(cf_reasons)
                recs.append(rec)
            recs.sort(key=lambda r: r.score, reverse=True)
            recs = [r for r in recs if r.score >= min_score]
            return recs[:top_k]

    # ─── Persistence ─────────────────────────────────

    def save(self, path: Path) -> None:
        """Save state to JSON."""
        data = {
            "profiles": [asdict(p) for p in self._profiles.values()],
            "metrics": {tid: asdict(m) for tid, m in self._metrics.items()},
            "history": [r.to_dict() for r in self._history],
            "open_counts": self._open_counts,
        }
        path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2, default=str),
            encoding="utf-8",
        )

    def load(self, path: Path) -> None:
        """Load state from JSON."""
        data = json.loads(path.read_text(encoding="utf-8"))
        with self._lock:
            self._profiles = {
                p["id"]: TechnicianProfile(**p) for p in data.get("profiles", [])
            }
            self._metrics = {
                tid: PerformanceMetrics(**m)
                for tid, m in data.get("metrics", {}).items()
            }
            self._history = [TicketRecord.from_dict(r) for r in data.get("history", [])]
            self._open_counts = data.get("open_counts", {})
            self._rebuild_history_index()


# ─── Global instance ─────────────────────────────────

_global_recommender: RecommenderV2 | None = None


def get_recommender() -> RecommenderV2:
    global _global_recommender
    if _global_recommender is None:
        _global_recommender = RecommenderV2()
    return _global_recommender


def reset_recommender() -> None:
    global _global_recommender
    _global_recommender = None
