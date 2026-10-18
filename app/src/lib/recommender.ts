// SPDX-License-Identifier: Apache-2.0
// DX-FSM Recommender v2 (A5.3) — TypeScript port

import { tokenize, buildIdf, vectorize, cosineSim } from './kb-search';
import { recommenderSeedProfiles } from './recommender-seed-profiles';
import { recommenderSeedMetrics } from './recommender-seed-metrics';
import { recommenderSeedRecords } from './recommender-seed-records';

export interface TechnicianProfile {
  id: string;
  name: string;
  employee_code: string;
  specialties: string[];
  skills: string[];
  level: number; // 1-4
  shift: 'business_hours' | 'extended' | 'oncall';
  active: boolean;
}

export interface PerformanceMetrics {
  technician_id: string;
  total_resolved: number;
  total_assigned: number;
  avg_resolution_hours: number;
  avg_satisfaction: number; // 0-5
  last_30d_resolved: number;
  category_breakdown: Record<string, number>;
}

export interface TicketContext {
  ticket_id: string;
  title: string;
  description?: string;
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimated_hours?: number;
  required_skills?: string[];
}

export interface Recommendation {
  technician: TechnicianProfile;
  score: number; // 0-100
  confidence: number; // 0-1
  reasons: string[];
  workload: number;
  estimated_pickup_hours: number;
}

// ─── Weights ───────────────────────────────────────

const W_SPECIALTY = 40;
const W_SKILL = 15;
const W_PERFORMANCE = 20;
const W_WORKLOAD = 15;
const W_LEVEL = 5;
const W_RECENCY = 5;
const MAX_WORKLOAD = 8;
const PRIORITY_MULT: Record<string, number> = {
  critical: 1.5,
  high: 1.2,
  medium: 1.0,
  low: 0.7,
};

// ─── Helpers ───────────────────────────────────────

function hasSpecialty(p: TechnicianProfile, cat: string): boolean {
  return p.specialties.includes(cat);
}

function hasSkill(p: TechnicianProfile, skill: string): boolean {
  return p.skills.some((s) => s.toLowerCase() === skill.toLowerCase());
}

function resolutionRate(m: PerformanceMetrics): number {
  if (m.total_assigned === 0) return 0;
  return Math.min(1, m.total_resolved / m.total_assigned);
}

function satisfactionNorm(m: PerformanceMetrics): number {
  return m.avg_satisfaction / 5;
}

// ─── Scorer ────────────────────────────────────────

function scoreSpecialty(p: TechnicianProfile, t: TicketContext): [number, string] {
  if (hasSpecialty(p, t.category)) return [1.0, `chuyên môn ${t.category}`];
  return [0.0, ''];
}

function scoreSkill(p: TechnicianProfile, t: TicketContext): [number, string[]] {
  if (!t.required_skills || t.required_skills.length === 0) return [0.5, []];
  const matched = t.required_skills.filter((s) => hasSkill(p, s));
  return [matched.length / t.required_skills.length, matched];
}

function scorePerformance(m: PerformanceMetrics): [number, string[]] {
  if (m.total_resolved === 0) return [0.0, []];
  const parts: number[] = [];
  parts.push(resolutionRate(m) * 0.4);
  parts.push(satisfactionNorm(m) * 0.4);
  const recent = Math.min(1, Math.log1p(m.last_30d_resolved) / Math.log1p(50));
  parts.push(recent * 0.2);
  return [
    parts.reduce((a, b) => a + b, 0),
    [
      `tỉ lệ xử lý ${(resolutionRate(m) * 100).toFixed(0)}%`,
      `đánh giá ${m.avg_satisfaction.toFixed(1)}/5`,
      `${m.last_30d_resolved} ticket 30 ngày qua`,
    ],
  ];
}

function scoreWorkload(
  _p: TechnicianProfile,
  m: PerformanceMetrics,
  t: TicketContext,
  openCount: number
): [number, string] {
  const workload = openCount > 0 ? openCount : Math.max(0, m.total_assigned - m.total_resolved);
  const mult = PRIORITY_MULT[t.priority] ?? 1.0;
  const effectiveMax = MAX_WORKLOAD / mult;
  if (workload >= effectiveMax) return [0.0, `đang bận (${workload} ticket)`];
  const score = Math.max(0, 1 - workload / effectiveMax);
  return [score, `workload ${workload}/${MAX_WORKLOAD}`];
}

function scoreLevel(p: TechnicianProfile, t: TicketContext): [number, string] {
  if ((t.priority === 'critical' || t.priority === 'high') && p.level >= 3) {
    return [1.0, `level ${p.level} (senior)`];
  }
  if (t.priority === 'medium' && p.level >= 2) return [0.8, `level ${p.level}`];
  if (t.priority === 'low' && p.level >= 1) return [0.6, `level ${p.level}`];
  return [0.4, `level ${p.level}`];
}

function scoreRecency(m: PerformanceMetrics): number {
  return Math.min(1, Math.log1p(m.last_30d_resolved) / Math.log1p(30));
}

function scoreTechnician(
  p: TechnicianProfile,
  m: PerformanceMetrics,
  t: TicketContext,
  openCount: number
): Recommendation {
  if (!p.active) {
    return {
      technician: p,
      score: 0,
      confidence: 0,
      reasons: ['KTV không active'],
      workload: openCount,
      estimated_pickup_hours: 99,
    };
  }
  const [specS, specR] = scoreSpecialty(p, t);
  const [skillS, skillMatches] = scoreSkill(p, t);
  const [perfS, perfReasons] = scorePerformance(m);
  const [wlS, wlR] = scoreWorkload(p, m, t, openCount);
  const [lvlS, lvlR] = scoreLevel(p, t);
  const recS = scoreRecency(m);

  let raw =
    specS * W_SPECIALTY +
    skillS * W_SKILL +
    perfS * W_PERFORMANCE +
    wlS * W_WORKLOAD +
    lvlS * W_LEVEL +
    recS * W_RECENCY;

  if (specS === 0) raw *= 0.5;
  if (t.priority === 'critical' && specS === 0) raw *= 0.3;
  if (t.priority === 'critical' && wlS < 0.3) raw *= 0.5;

  const score = Math.min(100, Math.max(0, raw));

  // Confidence
  let confidence = 0;
  if (m.total_resolved >= 5) confidence += 0.4;
  else if (m.total_resolved >= 1) confidence += 0.2;
  if (p.level >= 2) confidence += 0.2;
  if (specS === 1) confidence += 0.3;
  if (t.required_skills && skillMatches.length > 0) confidence += 0.1;
  confidence = Math.min(1, confidence);

  const reasons: string[] = [];
  if (specR) reasons.push(`Có ${specR}`);
  if (skillMatches.length) reasons.push(`Kỹ năng phù hợp: ${skillMatches.join(', ')}`);
  reasons.push(...perfReasons);
  if (wlR) reasons.push(wlR);
  if (lvlR) reasons.push(lvlR);
  if (!reasons.length) reasons.push('KTV khả dụng');

  return {
    technician: p,
    score,
    confidence,
    reasons,
    workload: openCount,
    estimated_pickup_hours: wlS > 0.5 ? 1.0 : 4.0,
  };
}

// ─── Recommender v2 ────────────────────────────────

export interface TicketRecord {
  ticket_id: string;
  technician_id: string;
  category: string;
  priority: string;
  title: string;
  description: string;
  resolution_hours: number;
  satisfaction: number;
  resolved: boolean;
}

export class RecommenderV2 {
  private profiles = new Map<string, TechnicianProfile>();
  private metrics = new Map<string, PerformanceMetrics>();
  private history: TicketRecord[] = [];
  private openCounts = new Map<string, number>();
  private historyIdf: Record<string, number> = {};

  addProfile(p: TechnicianProfile): void {
    this.profiles.set(p.id, p);
    if (!this.metrics.has(p.id)) {
      this.metrics.set(p.id, {
        technician_id: p.id,
        total_resolved: 0,
        total_assigned: 0,
        avg_resolution_hours: 0,
        avg_satisfaction: 0,
        last_30d_resolved: 0,
        category_breakdown: {},
      });
    }
  }

  addProfiles(profiles: TechnicianProfile[]): void {
    profiles.forEach((p) => this.addProfile(p));
  }

  getProfile(id: string): TechnicianProfile | undefined {
    return this.profiles.get(id);
  }

  allProfiles(): TechnicianProfile[] {
    return Array.from(this.profiles.values());
  }

  updateMetrics(techId: string, m: Partial<PerformanceMetrics>): void {
    const existing = this.metrics.get(techId) ?? {
      technician_id: techId,
      total_resolved: 0,
      total_assigned: 0,
      avg_resolution_hours: 0,
      avg_satisfaction: 0,
      last_30d_resolved: 0,
      category_breakdown: {},
    };
    this.metrics.set(techId, { ...existing, ...m });
  }

  setOpenCount(techId: string, count: number): void {
    this.openCounts.set(techId, Math.max(0, count));
  }

  addHistory(r: TicketRecord): void {
    this.history.push(r);
    this.rebuildHistoryIndex();
  }

  addHistoryMany(rs: TicketRecord[]): void {
    this.history.push(...rs);
    this.rebuildHistoryIndex();
  }

  private rebuildHistoryIndex(): void {
    const docs = this.history.map((r) =>
      tokenize(`${r.title} ${r.title} ${r.description} ${r.category} ${r.priority}`)
    );
    this.historyIdf = buildIdf(docs);
  }

  historySize(): number {
    return this.history.length;
  }

  // ─── Collaborative filter ────────────────────────

  private collaborativeBoost(
    ticket: TicketContext,
    techId: string
  ): [number, string[]] {
    if (!this.history.length) return [0, []];
    const qText = `${ticket.title} ${ticket.title} ${ticket.description ?? ''} ${ticket.category} ${ticket.priority}`;
    const qVec = vectorize(qText, this.historyIdf);
    if (!Object.keys(qVec).length) return [0, []];

    const sims: Array<[number, TicketRecord]> = [];
    for (const rec of this.history) {
      const text = `${rec.title} ${rec.title} ${rec.description} ${rec.category} ${rec.priority}`;
      const dVec = vectorize(text, this.historyIdf);
      const sim = cosineSim(qVec, dVec);
      if (sim > 0.1) sims.push([sim, rec]);
    }
    sims.sort((a, b) => b[0] - a[0]);
    const top = sims.slice(0, 10);
    if (!top.length) return [0, []];

    const techScores: Record<string, number> = {};
    for (const [sim, rec] of top) {
      techScores[rec.technician_id] = (techScores[rec.technician_id] ?? 0) + sim;
    }
    if (!(techId in techScores)) return [0, []];

    const total = Object.values(techScores).reduce((a, b) => a + b, 0);
    if (total === 0) return [0, []];
    const ownShare = techScores[techId] / total;
    const boost = Math.min(0.4, ownShare * 0.4);

    const reasons: string[] = [];
    if (ownShare > 0.3) {
      const similarCount = top.filter(([, r]) => r.technician_id === techId).length;
      reasons.push(`đã xử lý ${similarCount}/${top.length} ticket tương tự`);
    }
    return [boost, reasons];
  }

  // ─── Main recommend ─────────────────────────────

  recommend(ticket: TicketContext, topK = 3, minScore = 0): Recommendation[] {
    if (!this.profiles.size) return [];
    const recs: Recommendation[] = [];
    for (const p of this.profiles.values()) {
      const m = this.metrics.get(p.id) ?? {
        technician_id: p.id,
        total_resolved: 0,
        total_assigned: 0,
        avg_resolution_hours: 0,
        avg_satisfaction: 0,
        last_30d_resolved: 0,
        category_breakdown: {},
      };
      const openCount = this.openCounts.get(p.id) ?? 0;
      const rec = scoreTechnician(p, m, ticket, openCount);
      const [cfBoost, cfReasons] = this.collaborativeBoost(ticket, p.id);
      rec.score = Math.min(100, rec.score + cfBoost * 100);
      rec.reasons.push(...cfReasons);
      recs.push(rec);
    }
    recs.sort((a, b) => b.score - a.score);
    return recs.filter((r) => r.score >= minScore).slice(0, topK);
  }
}

// ─── Default seed ──────────────────────────────────

export function createDefaultRecommender(): RecommenderV2 {
  const rec = new RecommenderV2();
  rec.addProfiles(recommenderSeedProfiles);
  // Metrics
  for (const [tid, m] of Object.entries(recommenderSeedMetrics)) {
    rec.updateMetrics(tid, m);
  }
  // History
  rec.addHistoryMany(recommenderSeedRecords);
  return rec;
}
