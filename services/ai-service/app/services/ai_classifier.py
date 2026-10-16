"""
DX-FSM AI Service — AI classifier (A5.1)
Hybrid: Ollama LLM first, rule-based fallback khi LLM unavailable / timeout.

Cache: in-memory dict keyed by hash(title+description). TTL optional.
"""
from __future__ import annotations

import hashlib
import json
import logging
import time
from dataclasses import dataclass
from typing import Optional

import httpx

from .rule_classifier import Classification, rule_based_classify

logger = logging.getLogger(__name__)

# ─── Config ─────────────────────────────────────────────

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3.2:3b"
OLLAMA_TIMEOUT = 5.0  # seconds
CACHE_TTL_SEC = 3600  # 1 hour

PROMPT_TEMPLATE = """Bạn là trợ lý phân loại ticket IT. Phân tích ticket và trả về JSON.

Danh mục (chọn 1):
  - hardware: máy in, máy tính, laptop, màn hình, chuột, bàn phím, ổ cứng
  - software: phần mềm, ứng dụng, lỗi chương trình, license, đăng nhập
  - network: wifi, internet, mạng LAN, VPN, router
  - electrical: ổ cắm, aptomat, mất điện, đèn, đường điện
  - access_control: thẻ từ, vân tay, phân quyền, camera
  - service_request: yêu cầu cấp phát, bảo trì, nâng cấp
  - other: không thuộc các mục trên

Mức độ ưu tiên:
  - critical: ngừng sản xuất, mất dữ liệu, toàn bộ users bị ảnh hưởng
  - high: không thể làm việc, lỗi nghiêm trọng
  - medium: lỗi nhẹ, ảnh hưởng một người
  - low: bảo trì, nâng cấp, không gấp

Ticket:
Tiêu đề: {title}
Mô tả: {description}

Trả về JSON (chỉ JSON, không giải thích):
{{"category": "...", "priority": "...", "confidence": 0-100, "reasoning": "..."}}"""


# ─── Cache ──────────────────────────────────────────────

@dataclass
class _CacheEntry:
    value: Classification
    expires_at: float


_cache: dict[str, _CacheEntry] = {}


def _cache_key(title: str, description: str) -> str:
    raw = f"{title}|{description or ''}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:32]


def _cache_get(key: str) -> Optional[Classification]:
    entry = _cache.get(key)
    if not entry:
        return None
    if entry.expires_at < time.time():
        _cache.pop(key, None)
        return None
    return entry.value


def _cache_put(key: str, value: Classification) -> None:
    _cache[key] = _CacheEntry(
        value=value,
        expires_at=time.time() + CACHE_TTL_SEC,
    )


def cache_clear() -> int:
    """Clear all cache entries. Returns count cleared."""
    n = len(_cache)
    _cache.clear()
    return n


def cache_size() -> int:
    return len(_cache)


# ─── Ollama LLM call ────────────────────────────────────

def _ollama_classify(title: str, description: str) -> Optional[Classification]:
    """
    Call Ollama LLM. Returns Classification or None on failure.
    """
    prompt = PROMPT_TEMPLATE.format(title=title, description=description or "(không có)")
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "format": "json",
    }

    try:
        with httpx.Client(timeout=OLLAMA_TIMEOUT) as client:
            resp = client.post(OLLAMA_URL, json=payload)
            resp.raise_for_status()
            data = resp.json()
            text = data.get("response", "{}")
            parsed = json.loads(text)
            return Classification(
                category=parsed.get("category", "other"),
                priority=parsed.get("priority", "medium"),
                confidence=float(parsed.get("confidence", 50)),
                method="ai",
                details={"reasoning": parsed.get("reasoning", "")},
            )
    except (httpx.HTTPError, json.JSONDecodeError, KeyError, ValueError) as e:
        logger.warning("Ollama classify failed: %s", e)
        return None


# ─── Public API ─────────────────────────────────────────

def classify(
    title: str,
    description: str = "",
    *,
    use_cache: bool = True,
    use_ai: bool = True,
) -> Classification:
    """
    Hybrid classifier:
      1. Cache hit → return cached
      2. Ollama LLM (if use_ai=True) → success
      3. Rule-based fallback
    """
    key = _cache_key(title, description)

    # 1. Cache
    if use_cache:
        cached = _cache_get(key)
        if cached:
            # Mark as cached but reuse value
            return Classification(
                category=cached.category,
                priority=cached.priority,
                confidence=cached.confidence,
                method="cached",
                details=cached.details,
            )

    # 2. AI
    if use_ai:
        result = _ollama_classify(title, description)
        if result:
            if use_cache:
                _cache_put(key, result)
            return result

    # 3. Rule-based fallback
    result = rule_based_classify(title, description)
    if use_cache:
        _cache_put(key, result)
    return result
