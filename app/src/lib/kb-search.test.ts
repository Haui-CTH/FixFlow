// SPDX-License-Identifier: Apache-2.0
// DX-FSM KB search (A5.2) — vitest tests

import { describe, it, expect } from 'vitest';
import { KBSearchIndex, tokenize, createDefaultIndex } from './kb-search';

describe('kb-search.ts (A5.2)', () => {
  describe('tokenize', () => {
    it('lowercases and strips stopwords', () => {
      const tokens = tokenize('Máy in không hoạt động');
      expect(tokens).toContain('máy');
      expect(tokens).toContain('in');
      expect(tokens).not.toContain('không');
    });

    it('handles empty input', () => {
      expect(tokenize('')).toEqual([]);
      expect(tokenize(null as unknown as string)).toEqual([]);
    });

    it('strips punctuation', () => {
      const tokens = tokenize('Máy in, laptop, chuột!');
      const joined = tokens.join('');
      expect(joined).not.toContain(',');
      expect(joined).not.toContain('!');
    });

    it('filters short tokens', () => {
      const tokens = tokenize('a b c máy in');
      expect(tokens).not.toContain('a');
      expect(tokens).toContain('máy');
    });
  });

  describe('KBSearchIndex', () => {
    it('adds and retrieves articles', () => {
      const idx = new KBSearchIndex();
      idx.add({ id: '1', title: 'Test', body: 'Body', category: 'hw', tags: [] });
      expect(idx.size()).toBe(1);
      expect(idx.get('1')?.title).toBe('Test');
    });

    it('removes articles', () => {
      const idx = new KBSearchIndex();
      idx.add({ id: '1', title: 'Test', body: 'Body', category: 'hw', tags: [] });
      expect(idx.remove('1')).toBe(true);
      expect(idx.remove('1')).toBe(false);
      expect(idx.size()).toBe(0);
    });

    it('clears all articles', () => {
      const idx = new KBSearchIndex();
      idx.add({ id: '1', title: 'A', body: 'a', category: 'hw', tags: [] });
      idx.add({ id: '2', title: 'B', body: 'b', category: 'sw', tags: [] });
      idx.clear();
      expect(idx.size()).toBe(0);
    });

    it('returns empty before build', () => {
      const idx = new KBSearchIndex();
      idx.add({ id: '1', title: 'Test', body: 'Hello', category: 'hw', tags: [] });
      const results = idx.search('Hello');
      expect(results).toEqual([]);
    });

    it('searches and ranks by score', () => {
      const idx = new KBSearchIndex();
      idx.add({ id: 'wifi', title: 'WiFi guide', body: 'router reset', category: 'network', tags: ['wifi'] });
      idx.add({ id: 'laptop', title: 'Laptop battery', body: 'replacement', category: 'hardware', tags: [] });
      idx.build();
      const results = idx.search('WiFi router', 5);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].article.id).toBe('wifi');
    });

    it('respects topK limit', () => {
      const idx = new KBSearchIndex();
      for (let i = 0; i < 10; i++) {
        idx.add({ id: String(i), title: `Article ${i}`, body: 'common body', category: 'hw', tags: [] });
      }
      idx.build();
      const results = idx.search('Article', 3);
      expect(results.length).toBe(3);
    });

    it('filters by category', () => {
      const idx = new KBSearchIndex();
      idx.add({ id: 'hw', title: 'Test', body: 'content', category: 'hardware', tags: [] });
      idx.add({ id: 'sw', title: 'Test', body: 'content', category: 'software', tags: [] });
      idx.build();
      const results = idx.search('Test', 10, 0, 'hardware');
      expect(results.every((r) => r.article.category === 'hardware')).toBe(true);
    });

    it('filters by minScore', () => {
      const idx = new KBSearchIndex();
      idx.add({ id: 'a', title: 'WiFi guide', body: 'network router', category: 'network', tags: [] });
      idx.add({ id: 'b', title: 'Cooking recipe', body: 'salt sugar flour', category: 'general', tags: [] });
      idx.build();
      const results = idx.search('WiFi router', 10, 0.3);
      expect(results.every((r) => r.score >= 0.3)).toBe(true);
    });

    it('returns matched terms', () => {
      const idx = new KBSearchIndex();
      idx.add({ id: '1', title: 'WiFi guide', body: 'router', category: 'network', tags: [] });
      idx.build();
      const results = idx.search('WiFi router', 1);
      expect(results[0].matchedTerms.length).toBeGreaterThan(0);
    });

    it('returns empty for stop-word only query', () => {
      const idx = new KBSearchIndex();
      idx.add({ id: '1', title: 'Test', body: 'Body', category: 'hw', tags: [] });
      idx.build();
      const results = idx.search('không có được');
      expect(results).toEqual([]);
    });
  });

  describe('default seed', () => {
    it('loads 20 default articles', () => {
      const idx = createDefaultIndex();
      expect(idx.size()).toBe(20);
    });

    it('finds printer-related articles', () => {
      const idx = createDefaultIndex();
      idx.build();
      const results = idx.search('máy in không hoạt động', 3);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].article.title.toLowerCase()).toContain('máy in');
    });

    it('finds WiFi articles', () => {
      const idx = createDefaultIndex();
      const results = idx.search('WiFi mất kết nối', 3);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].article.category).toBe('network');
    });

    it('finds VPN articles', () => {
      const idx = createDefaultIndex();
      const results = idx.search('VPN không kết nối', 3);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].article.category).toBe('network');
    });

    it('finds password reset articles', () => {
      const idx = createDefaultIndex();
      const results = idx.search('quên mật khẩu', 3);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].article.category).toBe('access_control');
    });
  });
});
