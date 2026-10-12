# SPDX-License-Identifier: Apache-2.0
# DX-FSM AI Service – Ticket Classification

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class ClassifyRequest(BaseModel):
    title: str
    description: Optional[str] = None


class ClassifyResponse(BaseModel):
    category: str
    priority: str
    confidence: float
    recommendation: Optional[str] = None


CATEGORY_KEYWORDS = {
    "hardware": ["máy in", "màn hình", "bàn phím", "chuột", "máy tính", "laptop", "ram", "ổ cứng", "cpu"],
    "software": ["phần mềm", "ứng dụng", "lỗi", "cập nhật", "windows", "license", "đăng nhập", "app"],
    "network": ["wifi", "internet", "mạng", "lan", "router", "switch", "vpn", "dns", "wifi"],
    "electrical": ["điện", "ổ cắm", "aptomat", "ups", "nguồn", "dây điện"],
}

PRIORITY_KEYWORDS = {
    "critical": ["khẩn cấp", "quan trọng", "server", "mất dữ liệu", "hỏa hoạn", "ngừng hoạt động"],
    "high": ["không hoạt động", "lỗi nghiêm trọng", "không in được", "mất kết nối"],
    "medium": ["chậm", "lỗi nhẹ", "bất thường"],
    "low": ["bảo trì", "định kỳ", "nâng cấp", "tối ưu"],
}


def rule_based_classify(title: str, description: str = "") -> ClassifyResponse:
    text = (title + " " + (description or "")).lower()

    # Classify category
    category = "other"
    max_matches = 0
    for cat, keywords in CATEGORY_KEYWORDS.items():
        matches = sum(1 for kw in keywords if kw in text)
        if matches > max_matches:
            max_matches = matches
            category = cat

    # Classify priority
    priority = "medium"
    max_prio = 0
    for prio, keywords in PRIORITY_KEYWORDS.items():
        matches = sum(1 for kw in keywords if kw in text)
        if matches > max_prio:
            max_prio = matches
            priority = prio

    confidence = min(95.0, 60.0 + max_matches * 10 + max_prio * 5)

    return ClassifyResponse(
        category=category,
        priority=priority,
        confidence=confidence,
        recommendation=f"Gửi ticket đến bộ phận {category}",
    )


@router.post("", response_model=ClassifyResponse)
async def classify_ticket(request: ClassifyRequest):
    # Rule-based fallback (Ollama integration placeholder)
    return rule_based_classify(request.title, request.description)
