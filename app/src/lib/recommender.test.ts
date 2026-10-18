// SPDX-License-Identifier: Apache-2.0
// DX-FSM Recommender v2 (A5.3) — vitest tests

import { describe, it, expect } from 'vitest';
import {
  RecommenderV2,
  createDefaultRecommender,
  type TechnicianProfile,
  type PerformanceMetrics,
  type TicketContext,
} from './recommender';

function makeProfile(overrides: Partial<TechnicianProfile>): TechnicianProfile {
  return {
    id: 't',
    name: 'Test KTV',
    employee_code: 'T',
    specialties: [],
    skills: [],
    level: 2,
    shift: 'business_hours',
    active: true,
    ...overrides,
  };
}

function makeMetrics(overrides: Partial<PerformanceMetrics>): PerformanceMetrics {
  return {
    technician_id: 't',
    total_resolved: 0,
    total_assigned: 0,
    avg_resolution_hours: 0,
    avg_satisfaction: 0,
    last_30d_resolved: 0,
    category_breakdown: {},
    ...overrides,
  };
}

describe('recommender.ts (A5.3)', () => {
  describe('scoring', () => {
    it('specialty match gives high score', () => {
      const rec = new RecommenderV2();
      rec.addProfile(makeProfile({ id: 't1', specialties: ['hardware'] }));
      rec.updateMetrics('t1', makeMetrics({
        total_resolved: 100, total_assigned: 110,
        avg_satisfaction: 4.5, last_30d_resolved: 20,
      }));
      const t: TicketContext = {
        ticket_id: 'T', title: 'Test', category: 'hardware', priority: 'medium',
      };
      const recs = rec.recommend(t);
      expect(recs[0].score).toBeGreaterThan(50);
      expect(recs[0].reasons.some((r) => r.includes('hardware'))).toBe(true);
    });

    it('no specialty match penalizes', () => {
      const rec = new RecommenderV2();
      rec.addProfile(makeProfile({ id: 't1', specialties: ['software'] }));
      rec.updateMetrics('t1', makeMetrics({ total_resolved: 100, avg_satisfaction: 4.5 }));
      const t: TicketContext = {
        ticket_id: 'T', title: 'Test', category: 'hardware', priority: 'medium',
      };
      const recs = rec.recommend(t);
      expect(recs[0].score).toBeLessThan(50);
    });

    it('inactive tech scores 0', () => {
      const rec = new RecommenderV2();
      rec.addProfile(makeProfile({ id: 't1', active: false, specialties: ['hardware'] }));
      rec.updateMetrics('t1', makeMetrics({ total_resolved: 100 }));
      const t: TicketContext = {
        ticket_id: 'T', title: 'Test', category: 'hardware', priority: 'medium',
      };
      const recs = rec.recommend(t);
      expect(recs[0].score).toBe(0);
    });

    it('busy tech penalized', () => {
      const rec = new RecommenderV2();
      rec.addProfile(makeProfile({ id: 't1', specialties: ['hardware'] }));
      rec.addProfile(makeProfile({ id: 't2', specialties: ['hardware'] }));
      rec.updateMetrics('t1', makeMetrics({ total_resolved: 100, avg_satisfaction: 4.5 }));
      rec.updateMetrics('t2', makeMetrics({ total_resolved: 100, avg_satisfaction: 4.5 }));
      rec.setOpenCount('t1', 0);
      rec.setOpenCount('t2', 8);
      const t: TicketContext = {
        ticket_id: 'T', title: 'Test', category: 'hardware', priority: 'medium',
      };
      const recs = rec.recommend(t);
      // t1 (free) should score higher
      expect(recs[0].technician.id).toBe('t1');
    });

    it('skill match bonus', () => {
      const rec = new RecommenderV2();
      rec.addProfile(makeProfile({ id: 't1', specialties: ['hardware'], skills: ['cisco'] }));
      rec.updateMetrics('t1', makeMetrics({ total_resolved: 100, avg_satisfaction: 4.5 }));
      const t: TicketContext = {
        ticket_id: 'T', title: 'Test', category: 'hardware',
        priority: 'medium', required_skills: ['cisco'],
      };
      const recs = rec.recommend(t);
      expect(recs[0].reasons.some((r) => r.toLowerCase().includes('cisco'))).toBe(true);
    });

    it('critical priority requires specialty', () => {
      const rec = new RecommenderV2();
      rec.addProfile(makeProfile({ id: 't1', specialties: ['software'], level: 3 }));
      rec.addProfile(makeProfile({ id: 't2', specialties: ['hardware'], level: 3 }));
      rec.updateMetrics('t1', makeMetrics({ total_resolved: 100, avg_satisfaction: 4.5 }));
      rec.updateMetrics('t2', makeMetrics({ total_resolved: 100, avg_satisfaction: 4.5 }));
      const t: TicketContext = {
        ticket_id: 'T', title: 'Critical', category: 'hardware', priority: 'critical',
      };
      const recs = rec.recommend(t);
      expect(recs[0].technician.id).toBe('t2');
    });

    it('top_k respected', () => {
      const rec = new RecommenderV2();
      for (let i = 0; i < 10; i++) {
        rec.addProfile(makeProfile({ id: `t${i}`, specialties: ['hardware'] }));
        rec.updateMetrics(`t${i}`, makeMetrics({ total_resolved: 10, avg_satisfaction: 4 }));
      }
      const t: TicketContext = {
        ticket_id: 'T', title: 'Test', category: 'hardware', priority: 'medium',
      };
      const recs = rec.recommend(t, 3);
      expect(recs.length).toBe(3);
    });

    it('minScore filter', () => {
      const rec = new RecommenderV2();
      rec.addProfile(makeProfile({ id: 't1', specialties: ['hardware'] }));
      const t: TicketContext = {
        ticket_id: 'T', title: 'Test', category: 'hardware', priority: 'medium',
      };
      const recs = rec.recommend(t, 10, 80);
      // No metrics → 0 score
      expect(recs).toEqual([]);
    });
  });

  describe('collaborative filter', () => {
    it('boosts KTV with similar ticket history', () => {
      const rec = new RecommenderV2();
      rec.addProfile(makeProfile({ id: 't1', specialties: ['hardware'] }));
      rec.addProfile(makeProfile({ id: 't2', specialties: ['hardware'] }));
      rec.updateMetrics('t1', makeMetrics({ total_resolved: 50, avg_satisfaction: 4.5 }));
      rec.updateMetrics('t2', makeMetrics({ total_resolved: 50, avg_satisfaction: 4.5 }));

      // Add history: 5 printer issues → t1
      for (let i = 0; i < 5; i++) {
        rec.addHistory({
          ticket_id: `T-${i}`,
          technician_id: 't1',
          category: 'hardware',
          priority: 'high',
          title: 'Máy in không hoạt động',
          description: 'Printer offline',
          resolution_hours: 2,
          satisfaction: 5,
          resolved: true,
        });
      }
      const t: TicketContext = {
        ticket_id: 'NEW',
        title: 'Máy in bị lỗi',
        description: 'Printer broken',
        category: 'hardware',
        priority: 'high',
      };
      const recs = rec.recommend(t);
      expect(recs[0].technician.id).toBe('t1');
      // Should have CF reason
      expect(recs[0].reasons.some((r) => r.includes('tương tự'))).toBe(true);
    });

    it('no history → no CF boost', () => {
      const rec = new RecommenderV2();
      rec.addProfile(makeProfile({ id: 't1', specialties: ['hardware'] }));
      rec.updateMetrics('t1', makeMetrics({ total_resolved: 10, avg_satisfaction: 4 }));
      const t: TicketContext = {
        ticket_id: 'T', title: 'Test', category: 'hardware', priority: 'medium',
      };
      const recs = rec.recommend(t);
      expect(recs[0].reasons.some((r) => r.includes('tương tự'))).toBe(false);
    });
  });

  describe('default seed', () => {
    it('loads 8 technicians', () => {
      const rec = createDefaultRecommender();
      expect(rec.allProfiles().length).toBe(8);
    });

    it('has 30 history records', () => {
      const rec = createDefaultRecommender();
      expect(rec.historySize()).toBe(30);
    });

    it('recommends for hardware', () => {
      const rec = createDefaultRecommender();
      const t: TicketContext = {
        ticket_id: 'NEW', title: 'Máy in HP không hoạt động',
        category: 'hardware', priority: 'high',
      };
      const recs = rec.recommend(t);
      expect(recs.length).toBeGreaterThan(0);
      // Should recommend tech-001 (Trần Văn Kỹ Thuật, hardware specialist)
      expect(recs[0].technician.name).toContain('Trần');
    });

    it('recommends for network', () => {
      const rec = createDefaultRecommender();
      const t: TicketContext = {
        ticket_id: 'NEW', title: 'WiFi mất kết nối',
        category: 'network', priority: 'critical',
      };
      const recs = rec.recommend(t);
      // tech-003 (Phạm Minh Hùng) is network senior
      expect(recs[0].technician.id).toBe('tech-003');
    });

    it('recommends for access_control', () => {
      const rec = createDefaultRecommender();
      const t: TicketContext = {
        ticket_id: 'NEW', title: 'Thẻ từ không mở được cửa',
        category: 'access_control', priority: 'high',
      };
      const recs = rec.recommend(t);
      // tech-004 (Nguyễn Thị Hương) is access_control specialist
      expect(recs[0].technician.id).toBe('tech-004');
    });

    it('recommends for service_request', () => {
      const rec = createDefaultRecommender();
      const t: TicketContext = {
        ticket_id: 'NEW', title: 'Yêu cầu cài phần mềm',
        category: 'service_request', priority: 'low',
      };
      const recs = rec.recommend(t);
      // tech-007 (Vũ Thị Lan) is service_request specialist
      expect(['tech-006', 'tech-007']).toContain(recs[0].technician.id);
    });

    it('confidence in [0, 1]', () => {
      const rec = createDefaultRecommender();
      const t: TicketContext = {
        ticket_id: 'NEW', title: 'Test', category: 'hardware', priority: 'medium',
      };
      const recs = rec.recommend(t);
      for (const r of recs) {
        expect(r.confidence).toBeGreaterThanOrEqual(0);
        expect(r.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('all scores in [0, 100]', () => {
      const rec = createDefaultRecommender();
      const t: TicketContext = {
        ticket_id: 'NEW', title: 'Test', category: 'hardware', priority: 'medium',
      };
      const recs = rec.recommend(t);
      for (const r of recs) {
        expect(r.score).toBeGreaterThanOrEqual(0);
        expect(r.score).toBeLessThanOrEqual(100);
      }
    });

    it('all have non-empty reasons', () => {
      const rec = createDefaultRecommender();
      const t: TicketContext = {
        ticket_id: 'NEW', title: 'Test', category: 'hardware', priority: 'medium',
      };
      const recs = rec.recommend(t);
      for (const r of recs) {
        expect(r.reasons.length).toBeGreaterThan(0);
      }
    });
  });
});
