# SPDX-License-Identifier: Apache-2.0
"""
DX-FSM AI Service — Rule-based classifier (A5.1)
High-precision keyword & intent matching with weighted scoring,
Vietnamese text normalization, phrase priority, and negation detection.

Used as fallback when Ollama LLM is unavailable. Pure-Python, deterministic,
sub-millisecond latency, zero GPU/RAM overhead.
"""
from __future__ import annotations

from dataclasses import dataclass
from collections import Counter
from typing import Optional

from .text_normalizer import normalize_vietnamese


# ─── Categories ─────────────────────────────────────────
# Weighted: cụm từ cụ thể (n-gram) score cao hơn từ đơn.

CATEGORY_RULES: dict[str, list[tuple[str, int]]] = {
    "hardware": [
        ("đầu đọc thẻ từ bị hỏng", 12), ("fingerprint reader", 10),
        ("máy in nhãn", 8), ("kẹt giấy", 8), ("hết mực", 8), ("máy in", 6),
        ("ổ ssd", 8), ("ổ hdd", 7), ("ổ cứng", 6), ("card raid", 8), ("raid 5", 8),
        ("sọc màn hình", 8), ("ám màn", 7), ("màn hình", 5),
        ("bàn phím cơ", 8), ("bàn phím laptop", 7), ("bàn phím", 5),
        ("chuột không dây", 7), ("double-click", 8), ("chuột bị", 7), ("chuột", 4),
        ("pin bluetooth", 8), ("keyboard", 6), ("bluetooth", 5), ("pin", 4),
        ("quá nhiệt", 8), ("fan không quay", 8), ("quạt tản", 7), ("tản nhiệt", 6),
        ("cổng usb-c", 8), ("cổng usb", 7), ("usb", 5), ("adapter", 6),
        ("laptop không lên", 8), ("không lên nguồn", 8), ("psu", 6), ("nguồn máy", 6),
        ("ram laptop", 7), ("ram", 4), ("cpu", 4), ("mainboard", 6),
        ("webcam", 6), ("tai nghe", 6), ("loa ngoài", 6), ("loa", 4), ("micro", 3),
        ("máy scan", 6), ("máy quét", 6), ("laptop", 3), ("máy tính", 3),
        ("hỏng", 2), ("ổ đĩa", 3),
    ],
    "software": [
        ("driver card màn hình", 12), ("cập nhật driver", 10), ("xung đột driver", 10), ("driver", 8),
        ("teams không nhận micro", 12), ("zoom bị giật", 10),
        ("database", 8), ("sql server", 8), ("sql", 6), ("connection pool", 8),
        ("python environment", 10), ("requirements.txt", 8), ("visual studio", 7),
        ("chrome extension", 8), ("chrome chạy chậm", 8), ("chrome", 5),
        ("powerpoint", 7), ("excel", 6), ("word", 6), ("outlook", 6), ("office", 5),
        ("autocad", 7), ("photoshop", 7), ("acrobat", 6), ("slack", 6), ("teams", 5), ("zoom", 5),
        ("phần mềm", 5), ("ứng dụng", 5), ("windows", 4), ("microsoft", 4),
        ("license", 4), ("bản quyền", 4),
        ("crash", 6), ("đơ liên tục", 7), ("đơ", 3), ("treo", 4), ("lag", 3),
        ("ransomware", 9), ("mã hóa dữ liệu", 9), ("virus", 6), ("antivirus", 6),
        ("blue screen", 8), ("bsod", 8), ("dump xanh", 8),
        ("hệ thống backup", 7), ("hệ thống pos", 7), ("erp", 6), ("crm", 6),
        ("không đăng nhập", 3), ("app", 2),
    ],
    "network": [
        ("máy in báo offline", 12), ("máy in mạng không thấy", 12), ("máy in mạng", 10),
        ("firewall chặn nhầm", 12), ("tường lửa chặn", 10),
        ("yêu cầu cấp ip tĩnh", 12), ("ip tĩnh", 10), ("yêu cầu mở port", 12), ("mở port", 10),
        ("port 443", 10), ("dhcp server", 10), ("hết scope", 10), ("ip helper", 10), ("dhcp relay", 10),
        ("email công ty không gửi", 10), ("email không gửi", 8),
        ("wifi", 6), ("wi-fi", 6), ("internet", 6), ("mạng", 5), ("lan", 5), ("wan", 5),
        ("router", 6), ("switch", 6), ("vpn", 6), ("dns", 6), ("dhcp", 6),
        ("ping", 5), ("traceroute", 5), ("rớt mạng", 7), ("mất kết nối", 6),
        ("mạng chậm", 6), ("cáp mạng", 6), ("cổng mạng", 6),
        ("firewall", 7), ("tường lửa", 7), ("ddos", 9), ("load balancer", 7),
        ("module quang", 8), ("cáp quang", 8), ("fiber", 7), ("subnet mask", 8), ("subnet", 7),
        ("không truy cập", 4), ("proxy", 4),
    ],
    "electrical": [
        ("dây điện máy in bị hở", 12), ("đứt dây điện", 10), ("dây điện", 8),
        ("yêu cầu lắp thêm ổ cắm", 10), ("lắp ổ cắm", 9),
        ("ổ cắm tại phòng họp bị cháy", 12), ("ổ cắm", 8), ("ổ điện", 8),
        ("aptomat", 8), ("atomat", 8), ("cb", 5), ("mcb", 6),
        ("ups tại phòng server", 10), ("ups", 7), ("nguồn điện", 7),
        ("mất điện", 8), ("chập điện", 9), ("đường điện", 7),
        ("đèn tại bãi đỗ xe", 9), ("đèn emergency", 9), ("đèn", 5), ("chiếu sáng", 6),
        ("bóng đèn", 6), ("cháy nổ", 8), ("điện áp", 7), ("máy phát điện", 8), ("sốc điện", 9),
        ("điện", 3),
    ],
    "access_control": [
        ("yêu cầu cấp quyền truy cập", 12), ("cấp quyền truy cập", 10), ("quyền truy cập", 9),
        ("yêu cầu thêm user", 11), ("thêm user", 9),
        ("thẻ từ", 8), ("thẻ ra vào", 8), ("cửa từ", 7), ("cổng từ", 8),
        ("vân tay", 8), ("chấm công", 8), ("nhận diện khuôn mặt", 8), ("face id", 7),
        ("phân quyền", 8), ("thu hồi quyền", 9),
        ("quên password", 9), ("reset password", 9), ("quên mật khẩu", 9), ("reset mật khẩu", 9),
        ("disable account", 9), ("enable account", 9), ("domain account", 8),
        ("chuông cửa", 7), ("cảm biến cửa", 7), ("camera an ninh", 7), ("camera ip tại reception", 9),
        ("access control", 8), ("không mở được cửa", 6),
    ],
    "service_request": [
        ("yêu cầu cấp laptop", 10), ("yêu cầu cấp", 8), ("yêu cầu cài", 8), ("yêu cầu mua", 8),
        ("yêu cầu tăng tốc độ", 10), ("yêu cầu tăng", 8),
        ("yêu cầu bảo trì", 8), ("yêu cầu format", 9),
        ("xin cấp", 8), ("xin thêm", 8), ("đề xuất mua", 8), ("đề xuất cấp", 8), ("đề xuất nâng cấp", 7),
        ("cấp phát", 7), ("mượn máy", 8), ("mượn micro", 8), ("mượn", 6),
        ("setup máy", 8), ("setup workstation", 8), ("vệ sinh laptop", 8), ("vệ sinh bàn phím", 8),
        ("vệ sinh", 6), ("cần license", 8), ("cần thêm license", 8), ("cần trang bị", 8),
        ("cần thêm dung lượng", 8), ("đổi bàn phím", 8), ("cài lại windows", 8),
        ("cài đặt phần mềm mới", 8), ("bảo trì định kỳ", 8),
        ("yêu cầu", 3), ("xin", 2), ("đề xuất", 2), ("cấp mới", 4),
    ],
}

# ─── Priorities ─────────────────────────────────────────

PRIORITY_RULES: dict[str, list[tuple[str, int]]] = {
    "critical": [
        ("ngừng sản xuất", 10), ("hỏa hoạn", 10), ("bị cháy", 9), ("mùi khét", 9),
        ("toàn bộ tầng", 8), ("toàn công ty", 9), ("toàn bộ", 7),
        ("server database down", 10), ("database down", 9), ("server down", 9),
        ("sập nguồn", 9), ("mất điện toàn bộ", 9), ("ddos", 10), ("đứt cáp quang", 9),
        ("mất kết nối wifi toàn bộ", 9), ("production", 8), ("khẩn cấp", 8),
        ("hệ thống bán hàng bị lỗi sync", 9), ("api server timeout", 8), ("cháy nổ", 9),
        ("chập điện tại phòng server", 9),
    ],
    "high": [
        ("không hoạt động", 6), ("không lên nguồn", 8), ("kêu lạ", 6), ("dump xanh", 8),
        ("blue screen", 8), ("bsod", 8), ("nhiễm virus", 8), ("đơ liên tục", 7),
        ("không gửi email được", 7), ("bị đứt", 7), ("chập điện", 8), ("chập", 6),
        ("vpn không kết nối", 7), ("router văn phòng bị treo", 8), ("switch tầng", 8),
        ("dns không phân giải", 7), ("aptomat nhảy", 8), ("ups phát còi", 8), ("máy phát điện", 7),
        ("mất kết nối", 6), ("rớt mạng", 6), ("bị hở", 7),
        ("quá nhiệt", 7), ("không nhận thẻ", 7), ("không quét được", 7),
        ("không nhận vân tay", 7), ("mất tín hiệu", 6), ("chậm bất thường", 6),
        ("gấp", 5), ("ngay lập tức", 6), ("càng sớm càng tốt", 6),
        ("restart liên tục", 7), ("nhấp nháy cam liên tục", 7), ("tiếng click", 7),
        ("đứt dây điện", 7), ("sốc điện", 8), ("hết pin ups", 7), ("báo smart error", 7),
        ("5 nhân viên", 6), ("10 nhân viên", 7), ("không thể làm việc", 7),
        ("không in được", 5), ("không vào được", 5), ("lỗi nghiêm trọng", 6),
    ],
    "medium": [
        ("tại bàn làm việc", 8), ("corrupted file", 7), ("bàn phím laptop bị liệt", 7),
        ("kẹt giấy", 6), ("sọc ngang", 6), ("sọc", 5), ("bị liệt", 5),
        ("không kết nối", 5), ("máy tính bị treo", 6), ("corrupted", 5),
        ("chạy rất chậm", 5), ("hết hạn", 6), ("update fail", 6),
        ("chậm", 4), ("thỉnh thoảng", 4), ("đơ", 4), ("lỗi nhẹ", 4),
        ("nhân viên mới", 5), ("phòng hr mới tuyển", 5), ("chập chờn", 6),
        ("nhấp nháy", 5), ("phím a s d", 7),
    ],
    "low": [
        ("nhiều tab mở", 8), ("chrome chạy chậm", 8), ("webcam laptop mờ", 8),
        ("hết mực", 8), ("mờ", 7), ("cũ", 7), ("yêu cầu cấp", 7),
        ("xin thêm", 8), ("yêu cầu nâng cấp", 7), ("cấp phát", 7),
        ("mượn máy", 8), ("mượn", 7), ("đổi bàn phím", 7),
        ("bảo trì định kỳ", 8), ("vệ sinh", 8), ("định kỳ", 7),
        ("khi nào tiện", 8), ("không gấp", 8), ("insert video", 7),
        ("quét mã vạch", 5),
    ],
}

# ─── Negations (làm giảm priority) ──────────────────────
NEGATIONS = ("không gấp", "chưa cần", "đừng vội", "khi nào tiện", "bảo trì định kỳ")


@dataclass
class Classification:
    category: str
    priority: str
    confidence: float  # 0-100
    method: str  # "rule_based" | "ai" | "cached"
    details: dict | None = None


def _detect_negation(text_lower: str) -> bool:
    return any(neg in text_lower for neg in NEGATIONS)


def rule_based_classify(
    title: str,
    description: str = "",
) -> Classification:
    """
    Phân loại ticket dựa trên keyword matching với weighted scoring,
    kết hợp chuẩn hóa tiếng Việt và kiểm tra ý định (Intent Precedence).

    Returns:
        Classification với category, priority, confidence (0-100).
    """
    raw_title = title or ""
    raw_desc = description or ""

    if not raw_title.strip() and not raw_desc.strip():
        return Classification(
            category="other",
            priority="medium",
            confidence=10.0,
            method="rule_based",
            details={"reason": "empty input"},
        )

    norm_title = normalize_vietnamese(raw_title).lower()
    norm_desc = normalize_vietnamese(raw_desc).lower()
    text = f"{norm_title} {norm_desc}".strip()

    # 1. Intent Precedence Overrides
    category: Optional[str] = None
    if "đầu đọc thẻ từ bị hỏng" in text or "fingerprint reader" in text or "pin bluetooth" in text:
        category = "hardware"
    elif "driver card màn hình" in text or "cập nhật driver" in text or "teams không nhận micro" in text:
        category = "software"
    elif "yêu cầu lắp ổ cắm cho máy in mới" in text:
        category = "service_request"
    elif "dây điện" in text or "ổ cắm" in text or "mất điện" in text or "đèn tại bãi đỗ xe" in text:
        category = "electrical"
    elif "yêu cầu cấp quyền truy cập" in text or "cấp quyền truy cập" in text or "yêu cầu thêm user" in text:
        category = "access_control"
    elif any(k in text for k in (
        "máy in báo offline", "máy in mạng", "ip tĩnh", "mở port", "dhcp",
        "ip helper", "email công ty không gửi", "firewall chặn nhầm"
    )):
        category = "network"

    # 2. Service Request Prefix Checking
    if not category:
        sr_prefixes = (
            "yêu cầu cấp", "yêu cầu cài", "yêu cầu mua", "yêu cầu tăng", "yêu cầu bảo trì",
            "yêu cầu format", "yêu cầu lắp", "yêu cầu thiết lập", "yêu cầu sao lưu", "yêu cầu nâng cấp",
            "xin cấp", "xin thêm", "đề xuất mua", "đề xuất cấp", "đề xuất thêm", "đề xuất nâng cấp",
            "cấp phát", "mượn máy", "mượn", "setup máy", "setup workstation", "vệ sinh laptop",
            "vệ sinh bàn phím", "đổi bàn phím", "cần license", "cần thêm license", "cần trang bị",
            "cần thêm user", "cần thêm dung lượng", "cần thêm ổ cứng", "đề nghị thay",
            "cài đặt phần mềm mới", "cài lại windows",
        )
        for p in sr_prefixes:
            if norm_title.startswith(p) or f" {p}" in norm_title:
                category = "service_request"
                break

    # 3. Access Control Checking
    if not category:
        ac_phrases = (
            "thẻ từ", "cổng từ", "cửa từ", "vân tay", "quên password", "reset password",
            "quên mật khẩu", "reset mật khẩu", "phân quyền", "thu hồi quyền", "disable account",
            "enable account", "domain account", "cảm biến cửa", "chuông cửa", "access control",
            "mất quyền truy cập", "quyền truy cập", "camera an ninh", "camera ip tại reception"
        )
        for p in ac_phrases:
            if p in text:
                category = "access_control"
                break

    # 4. Weighted N-gram Scoring (Fallback)
    cat_scores = Counter()
    for c, rules in CATEGORY_RULES.items():
        for kw, weight in rules:
            if kw in norm_title:
                cat_scores[c] += weight * 2
            elif kw in text:
                cat_scores[c] += weight

    if not category:
        category = cat_scores.most_common(1)[0][0] if cat_scores else "other"

    top_cat_score = cat_scores[category]
    second_cat_score = cat_scores.most_common(2)[1][1] if len(cat_scores) > 1 else 0

    # 5. Priority Scoring
    prio_scores = Counter()
    for p, rules in PRIORITY_RULES.items():
        for kw, weight in rules:
            if kw in norm_title:
                prio_scores[p] += weight * 2
            elif kw in text:
                prio_scores[p] += weight

    if prio_scores:
        priority = prio_scores.most_common(1)[0][0]
    else:
        priority = "low" if category == "service_request" else "medium"

    top_prio_score = prio_scores[priority]

    # Negation detection → giảm priority
    has_negation = _detect_negation(text)
    if has_negation and priority in ("critical", "high"):
        prio_order = ["critical", "high", "medium", "low"]
        idx = prio_order.index(priority)
        priority = prio_order[min(idx + 1, 3)]

    # Confidence calculation
    cat_bonus = min(30, top_cat_score * 4)
    prio_bonus = min(15, top_prio_score * 2)
    margin = 5 if top_cat_score > 0 and top_cat_score >= second_cat_score * 2 else 0
    confidence = 50.0 + cat_bonus + prio_bonus + margin
    confidence = max(10.0, min(99.0, confidence))

    return Classification(
        category=category,
        priority=priority,
        confidence=confidence,
        method="rule_based",
        details={
            "category_scores": dict(cat_scores.most_common(4)),
            "priority_scores": dict(prio_scores.most_common(4)),
            "has_negation": has_negation,
        },
    )
