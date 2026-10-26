# SPDX-License-Identifier: Apache-2.0
"""
DX-FSM AI Service — AI classifier (A5.1)
Hybrid: Ollama LLM first, rule-based fallback khi LLM unavailable / timeout.

Cache: in-memory dict keyed by hash(title+description). TTL optional.
Circuit Breaker: nếu Ollama down, cooldown 15s để tránh block request liên tục.
"""
from __future__ import annotations

import hashlib
import json
import logging
import re
import time
from dataclasses import dataclass
from typing import Optional

try:
    import httpx
except ImportError:
    httpx = None  # type: ignore

from app.config import get_settings
from .rule_classifier import Classification, rule_based_classify

logger = logging.getLogger(__name__)

# ─── Config ─────────────────────────────────────────────

CACHE_TTL_SEC = 3600  # 1 hour
OLLAMA_COOLDOWN_SEC = 15.0  # seconds between retry when Ollama is unreachable

ALLOWED_CATEGORIES = {
    "hardware",
    "software",
    "network",
    "electrical",
    "access_control",
    "service_request",
    "other",
}

ALLOWED_PRIORITIES = {"critical", "high", "medium", "low"}

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


# ─── Circuit Breaker State ──────────────────────────────

_last_ollama_failure: float = 0.0


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
    Uses circuit-breaker cooldown when Ollama is offline.
    """
    global _last_ollama_failure

    if httpx is None:
        logger.debug("httpx not available, using rule-based engine")
        return None

    settings = get_settings()
    if not settings.enable_ai:
        return None

    # Circuit breaker check: if Ollama failed recently, skip immediately
    now = time.time()
    if now - _last_ollama_failure < OLLAMA_COOLDOWN_SEC:
        logger.debug("Ollama is in cooldown (%.1fs left), falling back to rule-based engine",
                     OLLAMA_COOLDOWN_SEC - (now - _last_ollama_failure))
        return None

    prompt = PROMPT_TEMPLATE.format(title=title, description=description or "(không có)")
    payload = {
        "model": settings.ollama_model,
        "prompt": prompt,
        "stream": False,
        "format": "json",
    }
    url = f"{settings.ollama_base_url.rstrip('/')}/api/generate"
    timeout = httpx.Timeout(
        timeout=float(settings.request_timeout),
        connect=float(settings.ollama_connect_timeout),
    )

    try:
        with httpx.Client(timeout=timeout) as client:
            resp = client.post(url, json=payload)
            if resp.status_code != 200:
                logger.info("Ollama returned HTTP %s: %s", resp.status_code, resp.text[:120])
                _last_ollama_failure = time.time()
                return None

            data = resp.json()
            text = (data.get("response") or "{}").strip()

            # Bóc markdown code fences nếu model tự bọc ```json ... ```
            if text.startswith("```"):
                text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
                text = re.sub(r"\s*```$", "", text)

            parsed = json.loads(text)

            category = str(parsed.get("category", "")).lower().strip()
            if category not in ALLOWED_CATEGORIES:
                category = "other"

            priority = str(parsed.get("priority", "")).lower().strip()
            if priority not in ALLOWED_PRIORITIES:
                priority = "medium"

            raw_conf = parsed.get("confidence", 70)
            try:
                confidence = float(raw_conf)
                confidence = max(0.0, min(100.0, confidence))
            except (TypeError, ValueError):
                confidence = 70.0

            reasoning = str(parsed.get("reasoning", "")).strip()

            return Classification(
                category=category,
                priority=priority,
                confidence=confidence,
                method="ai",
                details={
                    "reasoning": reasoning,
                    "model": settings.ollama_model,
                },
            )
    except (httpx.ConnectError, httpx.ConnectTimeout):
        _last_ollama_failure = time.time()
        logger.debug("Ollama is offline or unreachable at %s, falling back to rule-based engine", url)
        return None
    except httpx.TimeoutException:
        _last_ollama_failure = time.time()
        logger.info("Ollama request timed out after %ss, falling back to rule-based engine", settings.request_timeout)
        return None
    except (httpx.HTTPError, json.JSONDecodeError, KeyError, ValueError) as e:
        logger.warning("Ollama classify parse/HTTP error (%s), falling back to rule-based: %s", type(e).__name__, e)
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
