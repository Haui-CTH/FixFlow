// SPDX-License-Identifier: Apache-2.0
// DX-FSM Classifier evaluation (A5.1) - run via vitest
// Mirrors scripts/eval_classifier.py

import { describe, it, expect } from 'vitest';
import { ruleClassify } from './classifier-eval';
import { SAMPLES_CSV } from './classifier-samples';

interface Sample {
  id: number;
  title: string;
  description: string;
  expected_category: string;
  expected_priority: string;
}

function parseCSV(content: string): Sample[] {
  const lines = content.trim().split('\n');
  return lines.slice(1).map((line) => {
    // CSV: id,title,description,expected_category,expected_priority
    // Description may contain commas but never the pattern X,Y,Z,W pattern (4+ commas)
    // Simple split with limit
    const parts = line.split(',');
    return {
      id: parseInt(parts[0], 10),
      title: parts[1] || '',
      description: parts.slice(2, -2).join(',') || '',
      expected_category: parts[parts.length - 2] || '',
      expected_priority: parts[parts.length - 1] || '',
    };
  });
}

describe('classifier accuracy (A5.1)', () => {
  const samples = parseCSV(SAMPLES_CSV);

  it('loads 200 samples', () => {
    expect(samples.length).toBe(200);
  });

  it('category accuracy >= 85%', () => {
    let correct = 0;
    const failures: Array<{ id: number; title: string; expected: string; predicted: string }> = [];

    for (const s of samples) {
      const result = ruleClassify(s.title, s.description);
      if (result.category === s.expected_category) {
        correct++;
      } else {
        failures.push({
          id: s.id,
          title: s.title,
          expected: s.expected_category,
          predicted: result.category,
        });
      }
    }

    const acc = correct / samples.length;
    const pct = (acc * 100).toFixed(2);

    console.log(`\n[Category accuracy: ${pct}% (${correct}/${samples.length})]`);
    if (failures.length > 0) {
      console.log(`[Category failures: ${failures.length}]`);
      failures.forEach((f) => {
        console.log(`  #${String(f.id).padStart(3)} exp=${f.expected.padEnd(16)} got=${f.predicted.padEnd(16)} | ${f.title}`);
      });
    }

    expect(acc).toBeGreaterThanOrEqual(0.85);
  });

  it('priority accuracy >= 49%', () => {
    let correct = 0;
    for (const s of samples) {
      const result = ruleClassify(s.title, s.description);
      if (result.priority === s.expected_priority) {
        correct++;
      }
    }
    const acc = correct / samples.length;
    const pct = (acc * 100).toFixed(2);
    expect(acc).toBeGreaterThanOrEqual(0.49);
    console.log(`Priority accuracy: ${pct}% (${correct}/${samples.length})`);
  });

  it('confidence in 10-99 range', () => {
    for (const s of samples.slice(0, 50)) {
      const result = ruleClassify(s.title, s.description);
      expect(result.confidence).toBeGreaterThanOrEqual(10);
      expect(result.confidence).toBeLessThanOrEqual(99);
    }
  });
});
