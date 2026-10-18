# SPDX-License-Identifier: Apache-2.0
"""DX-FSM AI Service — Recommender v2 unit tests (A5.3)."""

import pytest
from pathlib import Path

from app.services.recommender_models import (
    TechnicianProfile,
    PerformanceMetrics,
    TicketContext,
    Recommendation,
)
from app.services.recommender_scorer import (
    score_technician,
    W_SPECIALTY,
    W_PERFORMANCE,
    PRIORITY_MULT,
)
from app.services.recommender_v2 import (
    RecommenderV2,
    TicketRecord,
    get_recommender,
    reset_recommender,
)


@pytest.fixture
def fresh_rec():
    reset_recommender()
    return get_recommender()


@pytest.fixture
def seeded_rec():
    """Recommender với 3 KTV seed."""
    reset_recommender()
    rec = get_recommender()
    rec.add_profiles([
        TechnicianProfile(
            id="t1", name="Senior HW", employee_code="T1",
            specialties=["hardware", "electrical"],
            skills=["windows", "linux", "cisco"],
            level=3, shift="business_hours",
        ),
        TechnicianProfile(
            id="t2", name="Mid SW", employee_code="T2",
            specialties=["software", "network"],
            skills=["windows", "office", "azure"],
            level=2, shift="business_hours",
        ),
        TechnicianProfile(
            id="t3", name="Junior SR", employee_code="T3",
            specialties=["service_request"],
            skills=["helpdesk"],
            level=1, shift="business_hours",
        ),
    ])
    rec.update_metrics("t1", total_resolved=200, total_assigned=210,
                       avg_resolution_hours=3.0, avg_satisfaction=4.8,
                       last_30d_resolved=25,
                       category_breakdown={"hardware": 180, "electrical": 20})
    rec.update_metrics("t2", total_resolved=80, total_assigned=90,
                       avg_resolution_hours=4.0, avg_satisfaction=4.2,
                       last_30d_resolved=10,
                       category_breakdown={"software": 60, "network": 20})
    rec.update_metrics("t3", total_resolved=20, total_assigned=25,
                       avg_resolution_hours=5.0, avg_satisfaction=3.8,
                       last_30d_resolved=3,
                       category_breakdown={"service_request": 20})
    rec.set_open_count("t1", 2)
    rec.set_open_count("t2", 4)
    rec.set_open_count("t3", 0)
    return rec


class TestTechnicianProfile:
    def test_has_specialty(self):
        p = TechnicianProfile(id="1", name="x", employee_code="X",
                              specialties=["hardware"])
        assert p.has_specialty("hardware")
        assert not p.has_specialty("software")

    def test_has_skill_case_insensitive(self):
        p = TechnicianProfile(id="1", name="x", employee_code="X",
                              skills=["Windows", "Cisco"])
        assert p.has_skill("windows")
        assert p.has_skill("CISCO")
        assert not p.has_skill("linux")


class TestPerformanceMetrics:
    def test_resolution_rate(self):
        m = PerformanceMetrics(technician_id="x", total_resolved=80, total_assigned=100)
        assert m.resolution_rate == 0.8

    def test_resolution_rate_zero_assigned(self):
        m = PerformanceMetrics(technician_id="x")
        assert m.resolution_rate == 0.0

    def test_satisfaction_norm(self):
        m = PerformanceMetrics(technician_id="x", avg_satisfaction=4.0)
        assert m.satisfaction_norm == 0.8

    def test_category_expertise(self):
        m = PerformanceMetrics(
            technician_id="x", total_resolved=100,
            category_breakdown={"hardware": 60, "software": 40},
        )
        assert m.category_expertise["hardware"] == 0.6
        assert m.category_expertise["software"] == 0.4


class TestScorer:
    def test_score_technician_specialty_match(self):
        p = TechnicianProfile(id="1", name="x", employee_code="X",
                              specialties=["hardware"], level=2)
        m = PerformanceMetrics(technician_id="1", total_resolved=100,
                               total_assigned=110, avg_satisfaction=4.5)
        t = TicketContext(ticket_id="T", title="Test", category="hardware", priority="medium")
        rec = score_technician(p, m, t, current_open=2)
        assert rec.score > 50
        assert any("hardware" in r.lower() for r in rec.reasons)

    def test_score_technician_no_specialty_penalty(self):
        """No specialty match → giảm 50% score."""
        p = TechnicianProfile(id="1", name="x", employee_code="X",
                              specialties=["software"], level=2)
        m = PerformanceMetrics(technician_id="1", total_resolved=100)
        t = TicketContext(ticket_id="T", title="Test", category="hardware", priority="medium")
        rec = score_technician(p, m, t, current_open=2)
        # Specialty=0 + performance normal → moderate score
        assert rec.score < 50

    def test_score_critical_requires_specialty(self):
        p_no = TechnicianProfile(id="1", name="x", employee_code="X",
                                 specialties=["software"], level=2)
        p_yes = TechnicianProfile(id="2", name="y", employee_code="Y",
                                  specialties=["hardware"], level=3)
        m = PerformanceMetrics(technician_id="1", total_resolved=100)
        t = TicketContext(ticket_id="T", title="Critical", category="hardware", priority="critical")
        rec_no = score_technician(p_no, m, t, current_open=2)
        rec_yes = score_technician(p_yes, m, t, current_open=2)
        assert rec_yes.score > rec_no.score
        assert rec_no.score < rec_yes.score * 0.7  # severe penalty

    def test_score_busy_tech_penalized(self):
        p = TechnicianProfile(id="1", name="x", employee_code="X",
                              specialties=["hardware"], level=2)
        m = PerformanceMetrics(technician_id="1", total_resolved=100)
        t = TicketContext(ticket_id="T", title="Test", category="hardware", priority="high")
        rec_free = score_technician(p, m, t, current_open=0)
        rec_busy = score_technician(p, m, t, current_open=8)
        assert rec_free.score > rec_busy.score

    def test_score_inactive_zero(self):
        p = TechnicianProfile(id="1", name="x", employee_code="X",
                              specialties=["hardware"], level=2, active=False)
        m = PerformanceMetrics(technician_id="1", total_resolved=100)
        t = TicketContext(ticket_id="T", title="Test", category="hardware")
        rec = score_technician(p, m, t)
        assert rec.score == 0.0

    def test_score_skill_match(self):
        p = TechnicianProfile(id="1", name="x", employee_code="X",
                              specialties=["hardware"], skills=["cisco", "linux"])
        m = PerformanceMetrics(technician_id="1", total_resolved=100)
        t = TicketContext(ticket_id="T", title="Test", category="hardware",
                          required_skills=["cisco"])
        rec = score_technician(p, m, t)
        assert any("cisco" in r.lower() for r in rec.reasons)


class TestRecommenderV2:
    def test_add_profile(self, fresh_rec):
        fresh_rec.add_profile(TechnicianProfile(id="t1", name="x", employee_code="X"))
        assert fresh_rec.get_profile("t1") is not None
        assert len(fresh_rec.all_profiles()) == 1

    def test_recommend_empty(self, fresh_rec):
        recs = fresh_rec.recommend(TicketContext(ticket_id="T", title="x", category="hardware"))
        assert recs == []

    def test_recommend_returns_top_k(self, seeded_rec):
        t = TicketContext(ticket_id="T", title="Test", category="hardware", priority="medium")
        recs = seeded_rec.recommend(t, top_k=2)
        assert len(recs) == 2
        # t1 (hardware specialist) should win
        assert recs[0].technician.id == "t1"

    def test_recommend_with_skills(self, seeded_rec):
        t = TicketContext(ticket_id="T", title="Test", category="hardware",
                          priority="medium", required_skills=["cisco"])
        recs = seeded_rec.recommend(t, top_k=3)
        # t1 has cisco skill
        assert any("cisco" in r.lower() for r in recs[0].reasons)

    def test_recommend_for_service_request(self, seeded_rec):
        t = TicketContext(ticket_id="T", title="Cài phần mềm", category="service_request", priority="low")
        recs = seeded_rec.recommend(t, top_k=3)
        # t3 là service_request specialist
        assert recs[0].technician.id == "t3"

    def test_recommend_critical_prefers_senior(self, seeded_rec):
        t = TicketContext(ticket_id="T", title="Critical issue", category="hardware", priority="critical")
        recs = seeded_rec.recommend(t, top_k=3)
        # Senior KTV với specialty + ít việc
        assert recs[0].technician.level >= 2

    def test_recommend_min_score_filter(self, seeded_rec):
        t = TicketContext(ticket_id="T", title="Test", category="hardware")
        recs = seeded_rec.recommend(t, top_k=10, min_score=90)
        # Only top scores
        assert all(r.score >= 90 for r in recs)

    def test_increment_resolved_updates_metrics(self, fresh_rec):
        fresh_rec.update_metrics("t1", total_resolved=0, last_30d_resolved=0)
        fresh_rec.increment_resolved("t1", category="hardware",
                                     resolution_hours=2.0, satisfaction=5)
        m = fresh_rec._metrics["t1"]
        assert m.total_resolved == 1
        assert m.last_30d_resolved == 1
        assert m.category_breakdown["hardware"] == 1
        assert m.avg_resolution_hours == 2.0
        assert m.avg_satisfaction == 5.0

    def test_increment_moving_average(self, fresh_rec):
        fresh_rec.update_metrics("t1", total_resolved=0)
        fresh_rec.increment_resolved("t1", category="hw", resolution_hours=2.0)
        fresh_rec.increment_resolved("t1", category="hw", resolution_hours=4.0)
        m = fresh_rec._metrics["t1"]
        # 2*0.8 + 4*0.2 = 2.4
        assert abs(m.avg_resolution_hours - 2.4) < 0.01

    def test_set_open_count(self, fresh_rec):
        fresh_rec.set_open_count("t1", 5)
        assert fresh_rec._open_counts["t1"] == 5

    def test_collaborative_filter_boost(self, fresh_rec):
        """History với similar tickets → same KTV → boost."""
        # Add some history
        fresh_rec.add_history_many([
            TicketRecord(
                ticket_id=f"T-{i}", technician_id="t1",
                category="hardware", priority="high",
                title="Máy in không hoạt động",
                description="Printer offline",
                resolution_hours=2.0, satisfaction=5, resolved=True,
            )
            for i in range(5)
        ])
        fresh_rec.add_profile(TechnicianProfile(
            id="t1", name="x", employee_code="X",
            specialties=["hardware"], level=2,
        ))
        # Query similar
        t = TicketContext(
            ticket_id="NEW", title="Máy in bị lỗi",
            description="Printer broken", category="hardware", priority="high",
        )
        recs = fresh_rec.recommend(t, top_k=1)
        # Should recommend t1 with high score + collaborative reason
        assert recs[0].technician.id == "t1"
        # Check có CF reason
        cf_reason = any("tương tự" in r.lower() for r in recs[0].reasons)
        assert cf_reason

    def test_recommend_with_no_history(self, seeded_rec):
        """Khi chưa có history → vẫn recommend dựa trên profile."""
        t = TicketContext(ticket_id="T", title="Test", category="hardware")
        recs = seeded_rec.recommend(t)
        assert len(recs) > 0
        # No CF reasons nhưng vẫn có skill/level reasons
        assert all(len(r.reasons) > 0 for r in recs)

    def test_save_load_roundtrip(self, seeded_rec, tmp_path):
        save_path = tmp_path / "rec.json"
        seeded_rec.save(save_path)
        assert save_path.exists()

        new_rec = RecommenderV2()
        new_rec.load(save_path)
        assert len(new_rec.all_profiles()) == 3
        assert new_rec.history_size() == 0  # no history in this fixture

    def test_thread_safety_add_profile(self, fresh_rec):
        import threading
        def adder(i):
            fresh_rec.add_profile(TechnicianProfile(
                id=f"t{i}", name=f"KTV {i}", employee_code=f"T{i}",
            ))
        threads = [threading.Thread(target=adder, args=(i,)) for i in range(20)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        assert len(fresh_rec.all_profiles()) == 20


class TestGlobalRecommender:
    def test_singleton(self):
        reset_recommender()
        r1 = get_recommender()
        r2 = get_recommender()
        assert r1 is r2

    def test_reset_creates_new(self):
        r1 = get_recommender()
        reset_recommender()
        r2 = get_recommender()
        assert r1 is not r2
