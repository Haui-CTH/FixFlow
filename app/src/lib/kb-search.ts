// SPDX-License-Identifier: Apache-2.0
// DX-FSM KB search (A5.2) — TypeScript port of services/ai-service/app/services/kb_search.py
// Used for FE-side suggestion + testing in vitest.

import { kbSeedArticles } from './kb-seed';

export interface KBArticle {
  id: string;
  title: string;
  body: string;
  category: string;
  tags: string[];
}

export interface SearchResult {
  article: KBArticle;
  score: number;
  matchedTerms: string[];
}

// ─── Tokenize ──────────────────────────────────────

const STOP_WORDS_VI = new Set([
  'là', 'của', 'và', 'cho', 'với', 'trong', 'không', 'có', 'được', 'những',
  'này', 'một', 'các', 'để', 'khi', 'thì', 'như', 'từ', 'cũng', 'thêm',
  'hay', 'bị', 'về', 'bởi', 'sẽ', 'đã', 'vẫn', 'thể', 'bằng', 'trên',
  'dưới', 'đến', 'nhé', 'nhỉ', 'à', 'ạ', 'ừ', 'um', 'huh', 'rất',
  'quá', 'lắm', 'nhiều', 'ít', 'hơn', 'nữa', 'mà', 'thôi', 'vào', 'ra',
  'lên', 'xuống', 'đi', 'đó', 'đây', 'nơi', 'chỗ', 'người', 'việc',
  'năm', 'ngày',
]);

export function tokenize(text: string): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  // Replace non-word with space
  const cleaned = lower.replace(/[^\w\sáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]/g, ' ');
  return cleaned
    .split(/\s+/)
    .filter((t) => t && !STOP_WORDS_VI.has(t) && t.length > 1);
}

// ─── TF / IDF ──────────────────────────────────────

function computeTf(tokens: string[]): Record<string, number> {
  if (!tokens.length) return {};
  const counts: Record<string, number> = {};
  for (const t of tokens) counts[t] = (counts[t] || 0) + 1;
  const total = tokens.length;
  const tf: Record<string, number> = {};
  for (const t in counts) tf[t] = counts[t] / total;
  return tf;
}

function computeIdf(documents: string[][]): Record<string, number> {
  const n = documents.length;
  if (n === 0) return {};
  const df: Record<string, number> = {};
  for (const doc of documents) {
    const seen = new Set(doc);
    for (const term of seen) df[term] = (df[term] || 0) + 1;
  }
  const idf: Record<string, number> = {};
  for (const t in df) {
    idf[t] = Math.log(n / (1 + df[t]));
  }
  return idf;
}

function vectorize(text: string, idf: Record<string, number>): Record<string, number> {
  const tokens = tokenize(text);
  const tf = computeTf(tokens);
  const v: Record<string, number> = {};
  for (const t in tf) {
    v[t] = tf[t] * (idf[t] || 0);
  }
  return v;
}

function cosineSim(a: Record<string, number>, b: Record<string, number>): number {
  const keys = Object.keys(a).filter((k) => k in b);
  if (!keys.length) return 0;
  const dot = keys.reduce((s, k) => s + a[k] * b[k], 0);
  const magA = Math.sqrt(Object.values(a).reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(Object.values(b).reduce((s, v) => s + v * v, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

// ─── KBSearchIndex ─────────────────────────────────

export class KBSearchIndex {
  private articles: Map<string, KBArticle> = new Map();
  private idf: Record<string, number> = {};
  private docIds: string[] = [];

  add(article: KBArticle): void {
    this.articles.set(article.id, article);
  }

  addMany(articles: KBArticle[]): void {
    for (const a of articles) this.articles.set(a.id, a);
  }

  remove(id: string): boolean {
    return this.articles.delete(id);
  }

  clear(): void {
    this.articles.clear();
    this.idf = {};
    this.docIds = [];
  }

  size(): number {
    return this.articles.size;
  }

  get(id: string): KBArticle | undefined {
    return this.articles.get(id);
  }

  allArticles(): KBArticle[] {
    return Array.from(this.articles.values());
  }

  build(): void {
    this.docIds = Array.from(this.articles.keys());
    const corpus: string[][] = [];
    for (const aid of this.docIds) {
      const a = this.articles.get(aid)!;
      // Title weighted 3x
      const text = `${a.title} ${a.title} ${a.title} ${a.body} ${a.tags.join(' ')}`;
      corpus.push(tokenize(text));
    }
    this.idf = computeIdf(corpus);
  }

  search(
    query: string,
    topK = 5,
    minScore = 0,
    category?: string
  ): SearchResult[] {
    if (!this.docIds.length) return [];
    const qVec = vectorize(query, this.idf);
    if (!Object.keys(qVec).length) return [];
    const qTerms = new Set(Object.keys(qVec));
    const results: SearchResult[] = [];
    for (const aid of this.docIds) {
      const a = this.articles.get(aid)!;
      if (category && a.category !== category) continue;
      const docText = `${a.title} ${a.title} ${a.title} ${a.body} ${a.tags.join(' ')}`;
      const dVec = vectorize(docText, this.idf);
      const score = cosineSim(qVec, dVec);
      if (score < minScore) continue;
      const matched = Array.from(qTerms).filter((t) => t in dVec);
      results.push({ article: a, score, matchedTerms: matched });
    }
    results.sort((x, y) => y.score - x.score);
    return results.slice(0, topK);
  }
}

// ─── Pre-seeded index ──────────────────────────────

export function createDefaultIndex(): KBSearchIndex {
  const idx = new KBSearchIndex();
  idx.addMany(kbSeedArticles);
  idx.build();
  return idx;
}
