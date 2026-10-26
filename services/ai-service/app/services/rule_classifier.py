# SPDX-License-Identifier: Apache-2.0
"""
DX-FSM AI Service — Rule-based classifier (A5.1)
Keyword matching với weighted scoring + phrase priority + negation detection.

Used as fallback khi Ollama LLM unavailable. Pure-Python, deterministic,
no network dependency.
"""
from __future__ import annotations

from dataclasses import dataclass


# ─── Categories ─────────────────────────────────────────
# Weighted: cụm từ cụ thể (n-gram) score cao hơn từ đơn.

CATEGORY_RULES: dict[str, list[tuple[str, int]]] = {
    "hardware": [
        # N-grams (high weight)
        ("máy in", 4), ("laptop không", 4), ("màn hình", 3), ("bàn phím", 3),
        ("chuột không", 4), ("ổ cứng", 3), ("ram", 2), ("cpu", 2),
        ("mainboard", 3), ("card màn hình", 3), ("vga", 2), ("psu", 2),
        ("nguồn máy", 3), ("quạt tản", 3), ("tản nhiệt", 2),
        # Single keywords (low weight)
        ("máy tính", 2), ("laptop", 2), ("máy", 1), ("in", 1), ("mực in", 3),
        ("hỏng", 2), ("cháy", 3), ("kẹt giấy", 4), ("scan", 2), ("webcam", 2),
        ("loa", 2), ("tai nghe", 2), ("micro", 2), ("ổ đĩa", 2),
    ],
    "software": [
        ("phần mềm", 3), ("ứng dụng", 3), ("windows", 2), ("microsoft", 2),
        ("office", 3), ("word", 2), ("excel", 2), ("outlook", 2),
        ("không đăng nhập", 4), ("đăng nhập", 2), ("password", 2), ("license", 3),
        ("bản quyền", 3), ("crash", 3), ("đơ", 2), ("treo", 2), ("lag", 2),
        ("virus", 3), ("malware", 3), ("cập nhật", 2), ("update", 2),
        ("cài đặt", 2), ("gỡ cài đặt", 3), ("app", 2), ("driver", 3),
        ("blue screen", 4), ("bsod", 4), ("lỗi", 1), ("error", 1),
    ],
    "network": [
        ("wifi", 3), ("wi-fi", 3), ("internet", 3), ("mạng", 2), ("lan", 2),
        ("wan", 2), ("router", 3), ("switch", 3), ("vpn", 3),
        ("dns", 3), ("ip address", 3), ("ping", 2), ("traceroute", 2),
        ("không truy cập", 4), ("mất kết nối", 4), ("chậm mạng", 3),
        ("mạng chậm", 3), ("rớt mạng", 4), ("cáp mạng", 3), ("cổng mạng", 3),
        ("proxy", 2), ("firewall", 3), ("ip", 1), ("ethernet", 3),
    ],
    "electrical": [
        ("ổ cắm", 3), ("aptomat", 3), ("atomat", 3), ("cb", 1), ("mcb", 2),
        ("ups", 2), ("nguồn điện", 3), ("mất điện", 4), ("chập điện", 4),
        ("dây điện", 3), ("đường điện", 2), ("đèn", 2), ("chiếu sáng", 3),
        ("bóng đèn", 3), ("điện", 2), ("cháy nổ", 4), ("điện áp", 3),
    ],
    "access_control": [
        ("thẻ từ", 3), ("thẻ ra vào", 4), ("cửa từ", 3), ("cổng từ", 3),
        ("vân tay", 3), ("nhận diện khuôn mặt", 4), ("face id", 3),
        ("phân quyền", 3), ("quyền truy cập", 4), ("không vào được", 4),
        ("không mở được cửa", 4), ("camera", 2), ("an ninh", 2),
    ],
    "service_request": [
        ("yêu cầu", 2), ("xin", 1), ("cần", 1), ("đề xuất", 2),
        ("cấp", 1), ("cấp phát", 2), ("mượn", 2), ("trả", 1),
        ("đổi", 1), ("bảo trì", 3), ("vệ sinh", 2), ("nâng cấp", 2),
        ("mới", 1), ("thêm", 1), ("thiết lập", 2),
    ],
}

# ─── Priorities ─────────────────────────────────────────

PRIORITY_RULES: dict[str, list[tuple[str, int]]] = {
    "critical": [
        # Ảnh hưởng toàn bộ hệ thống / sản xuất / doanh thu
        ("khẩn cấp", 4), ("ngừng sản xuất", 5), ("toàn bộ", 3),
        ("hỏa hoạn", 5), ("cháy nổ", 5), ("mất dữ liệu", 5),
        ("mất điện", 4), ("server down", 5), ("sập", 4), ("down", 3),
        ("không thể truy cập", 4), ("toàn công ty", 4),
        ("nhiều người dùng", 4), ("production", 4), ("prod", 3),
        ("doanh thu", 4), ("khách hàng", 3), ("deadline", 3),
    ],
    "high": [
        ("không hoạt động", 4), ("không in được", 4), ("không vào được", 4),
        ("không truy cập được", 4), ("không kết nối", 4), ("mất kết nối", 4),
        ("lỗi nghiêm trọng", 4), ("nghiêm trọng", 3), ("gấp", 3),
        ("ngay lập tức", 4), ("càng sớm càng tốt", 4), ("cản trở", 3),
        ("không thể làm việc", 4), ("không dùng được", 3), ("hỏng", 2),
        ("cháy", 3), ("nổ", 3),
    ],
    "medium": [
        ("chậm", 2), ("lỗi nhẹ", 3), ("bất thường", 2), ("thỉnh thoảng", 2),
        ("khó", 1), ("khó chịu", 2), ("báo lỗi", 2), ("warning", 2),
    ],
    "low": [
        ("bảo trì", 3), ("định kỳ", 3), ("nâng cấp", 2), ("tối ưu", 2),
        ("đề xuất", 2), ("góp ý", 2), ("khi nào tiện", 3), ("không gấp", 3),
        ("mong muốn", 2), ("nếu có thể", 2), ("thuận tiện", 2),
    ],
}

# ─── Negations (làm giảm priority) ──────────────────────
NEGATIONS = ("không", "chưa", "đừng", "không còn", "hết")


@dataclass
class Classification:
    category: str
    priority: str
    confidence: float  # 0-100
    method: str  # "rule_based" | "ai" | "cached"
    details: dict | None = None


def _score(text_lower: str, rules: dict[str, list[tuple[str, int]]]) -> list[tuple[str, int]]:
    """Return [(label, total_score), ...] sorted desc by score."""
    scores: list[tuple[str, int]] = []
    for label, keywords in rules.items():
        total = 0
        for kw, weight in keywords:
            if kw in text_lower:
                total += weight
        scores.append((label, total))
    scores.sort(key=lambda x: x[1], reverse=True)
    return scores


def _detect_negation(text_lower: str) -> bool:
    return any(neg in text_lower for neg in NEGATIONS)


def rule_based_classify(
    title: str,
    description: str = "",
) -> Classification:
    """
    Phân loại ticket dựa trên keyword matching với weighted scoring.

    Returns:
        Classification với category, priority, confidence (0-100).
    """
    text = f"{title or ''} {description or ''}".lower().strip()
    if not text:
        return Classification(
            category="other",
            priority="medium",
            confidence=10.0,
            method="rule_based",
            details={"reason": "empty input"},
        )

    # Category
    cat_scores = _score(text, CATEGORY_RULES)
    top_cat, top_cat_score = cat_scores[0]
    second_cat_score = cat_scores[1][1] if len(cat_scores) > 1 else 0

    # Priority
    prio_scores = _score(text, PRIORITY_RULES)
    top_prio, top_prio_score = prio_scores[0]

    # Negation detection → giảm priority
    has_negation = _detect_negation(text)
    if has_negation and top_prio in ("critical", "high"):
        # Downgrade by 1
        prio_order = ["critical", "high", "medium", "low"]
        idx = prio_order.index(top_prio)
        top_prio = prio_order[min(idx + 1, 3)]
        top_prio_score = max(1, top_prio_score // 2)

    # Tie-breaker: if first/second equal, prefer more specific category
    if top_cat_score == 0:
        category = "other"
    elif top_cat_score == second_cat_score:
        # both equal — pick "other" only if all zeros, else first
        category = top_cat
    else:
        category = top_cat

    if top_prio_score == 0:
        # Không có tín hiệu khẩn cấp: yêu cầu cấp phát/đề nghị thường ưu tiên thấp, còn lại trung bình
        priority = "low" if category == "service_request" else "medium"
    else:
        priority = top_prio

    # Confidence:
    #   - base 50
    #   - +5 per category point (max +30)
    #   - +3 per priority point (max +15)
    #   - +5 if winner beat second by ≥2x (clear signal)
    #   - clamp to [10, 99]
    cat_bonus = min(30, top_cat_score * 5)
    prio_bonus = min(15, top_prio_score * 3)
    margin = 5 if top_cat_score > 0 and top_cat_score >= second_cat_score * 2 else 0
    confidence = 50.0 + cat_bonus + prio_bonus + margin
    confidence = max(10.0, min(99.0, confidence))

    return Classification(
        category=category,
        priority=priority,
        confidence=confidence,
        method="rule_based",
        details={
            "category_scores": dict(cat_scores[:4]),
            "priority_scores": dict(prio_scores[:4]),
            "has_negation": has_negation,
        },
    )
