#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""
DX-FSM AI Classifier Evaluation (A5.1)

Đánh giá accuracy của classifier trên labeled samples.
- Compute per-category + per-priority accuracy
- Show confusion matrix
- Exit 0 nếu accuracy >= threshold, exit 1 nếu < threshold.

Usage:
  python scripts/eval_classifier.py \
    --csv services/ai-service/tests/fixtures/ticket_samples.csv \
    --threshold 0.85 \
    [--no-ai]   # rule-based only
"""
from __future__ import annotations

import argparse
import csv
import json
import sys
from collections import Counter
from pathlib import Path
from typing import Any

# Add ai-service to path
SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
AI_SERVICE = REPO_ROOT / "services" / "ai-service"
sys.path.insert(0, str(AI_SERVICE))

from app.services.ai_classifier import classify  # noqa: E402
from app.services import ai_classifier as _mod  # noqa: E402


def load_samples(csv_path: Path) -> list[dict[str, Any]]:
    samples = []
    with csv_path.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            samples.append({
                "id": int(row["id"]),
                "title": row["title"],
                "description": row.get("description", ""),
                "expected_category": row["expected_category"],
                "expected_priority": row["expected_priority"],
            })
    return samples


def evaluate(samples: list[dict], *, use_ai: bool) -> dict:
    if not use_ai:
        _mod.cache_clear()
    correct_cat = 0
    correct_prio = 0
    correct_both = 0
    cat_confusion: dict[str, Counter] = {}
    prio_confusion: dict[str, Counter] = {}
    method_counts: Counter = Counter()
    failures: list[dict] = []

    for sample in samples:
        result = classify(
            sample["title"],
            sample["description"],
            use_ai=use_ai,
        )
        method_counts[result.method] += 1

        pred_cat = result.category
        pred_prio = result.priority
        exp_cat = sample["expected_category"]
        exp_prio = sample["expected_priority"]

        cat_match = pred_cat == exp_cat
        prio_match = pred_prio == exp_prio

        if cat_match:
            correct_cat += 1
        else:
            cat_confusion.setdefault(exp_cat, Counter())[pred_cat] += 1
        if prio_match:
            correct_prio += 1
        else:
            prio_confusion.setdefault(exp_prio, Counter())[pred_prio] += 1
        if cat_match and prio_match:
            correct_both += 1

        if not cat_match or not prio_match:
            failures.append({
                "id": sample["id"],
                "title": sample["title"],
                "expected": f"{exp_cat}/{exp_prio}",
                "predicted": f"{pred_cat}/{pred_prio}",
                "confidence": result.confidence,
            })

    total = len(samples)
    return {
        "total": total,
        "category_accuracy": correct_cat / total,
        "priority_accuracy": correct_prio / total,
        "both_accuracy": correct_both / total,
        "category_confusion": {k: dict(v) for k, v in cat_confusion.items()},
        "priority_confusion": {k: dict(v) for k, v in prio_confusion.items()},
        "method_counts": dict(method_counts),
        "failures": failures,
    }


def print_report(report: dict, threshold: float) -> None:
    print()
    print("=" * 70)
    print(f"  DX-FSM AI Classifier Evaluation — {report['total']} samples")
    print("=" * 70)
    print(f"  Category accuracy:   {report['category_accuracy']*100:6.2f}%")
    print(f"  Priority accuracy:   {report['priority_accuracy']*100:6.2f}%")
    print(f"  Both correct:        {report['both_accuracy']*100:6.2f}%")
    print(f"  Methods used:        {report['method_counts']}")
    print()

    if report["category_confusion"]:
        print("─ Category confusion (expected → predicted) ─")
        for exp, preds in sorted(report["category_confusion"].items()):
            for pred, count in sorted(preds.items(), key=lambda x: -x[1]):
                print(f"  {exp:18} → {pred:18} : {count}")
        print()

    if report["priority_confusion"]:
        print("─ Priority confusion (expected → predicted) ─")
        for exp, preds in sorted(report["priority_confusion"].items()):
            for pred, count in sorted(preds.items(), key=lambda x: -x[1]):
                print(f"  {exp:10} → {pred:10} : {count}")
        print()

    if report["failures"]:
        print(f"─ First 20 failures (total {len(report['failures'])}) ─")
        for f in report["failures"][:20]:
            print(f"  #{f['id']:3}  exp={f['expected']:18}  pred={f['predicted']:18}  conf={f['confidence']:.0f}  title={f['title'][:50]}")
        print()

    threshold_pct = threshold * 100
    cat_pct = report["category_accuracy"] * 100
    passed = cat_pct >= threshold_pct
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"  Threshold: {threshold_pct:.0f}%  Got: {cat_pct:.2f}%  → {status}")
    print("=" * 70)
    print()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--csv",
        type=Path,
        default=AI_SERVICE / "tests" / "fixtures" / "ticket_samples.csv",
    )
    parser.add_argument("--threshold", type=float, default=0.85)
    parser.add_argument("--no-ai", action="store_true", help="Rule-based only")
    parser.add_argument("--json", action="store_true", help="JSON output")
    parser.add_argument(
        "--fail-on-below",
        action="store_true",
        help="Exit 1 if accuracy < threshold (default for CI)",
    )
    args = parser.parse_args()

    if not args.csv.exists():
        print(f"❌ CSV not found: {args.csv}", file=sys.stderr)
        return 2

    samples = load_samples(args.csv)
    if not samples:
        print(f"❌ Empty CSV: {args.csv}", file=sys.stderr)
        return 2

    report = evaluate(samples, use_ai=not args.no_ai)

    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        print_report(report, args.threshold)

    if args.fail_on_below and report["category_accuracy"] < args.threshold:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
