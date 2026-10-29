# SPDX-License-Identifier: Apache-2.0
"""
DX-FSM AI Service — Vietnamese Text Normalizer & Tech Synonyms.
Provides lightning-fast normalization of Vietnamese teencode, common abbreviations,
tech slang, and repeated characters (< 0.1ms, 0MB RAM footprint).
"""
from __future__ import annotations

import re
import unicodedata

# Common Vietnamese IT & academic abbreviations/teencode
ABBREVIATIONS: dict[str, str] = {
    "ko": "không",
    "k": "không",
    "khong": "không",
    "kô": "không",
    "hong": "không",
    "dc": "được",
    "đc": "được",
    "duoc": "được",
    "lap": "laptop",
    "pc": "máy tính",
    "sv": "sinh viên",
    "gv": "giảng viên",
    "cb": "cán bộ",
    "nv": "nhân viên",
    "acc": "tài khoản",
    "pass": "mật khẩu",
    "pw": "mật khẩu",
    "pwd": "mật khẩu",
    "cfg": "cấu hình",
    "config": "cấu hình",
    "app": "ứng dụng",
    "soft": "phần mềm",
    "net": "mạng",
    "kb": "bàn phím",
    "fb": "phản hồi",
    "db": "database",
    "mon": "màn hình",
    "lcd": "màn hình",
}

# Regex for repeated characters (e.g., chậmmm -> chậm, đơơơ -> đơ)
REPEATED_CHARS_REGEX = re.compile(r"([a-zà-ỹA-ZÀ-Ỹ])\1{2,}", re.IGNORECASE)

# Regex to expand room prefixes (e.g. P.305, p305 -> phòng 305)
ROOM_REGEX = re.compile(r"\b[pP]\.?\s*(\d{2,4}[a-zA-Z]?)\b")


def normalize_vietnamese(text: str) -> str:
    """
    Standardize Vietnamese text:
    1. Unicode NFC normalization.
    2. Expand room/building abbreviations (P.302 -> phòng 302).
    3. Reduce character elongation (chậmmm -> chậm).
    4. Expand tech/academic abbreviations and teencode.
    """
    if not text:
        return ""

    # 1. NFC normalization
    text = unicodedata.normalize("NFC", text)

    # 2. Expand room notation
    text = ROOM_REGEX.sub(r"phòng \1", text)

    # 3. Collapse character repetitions (chậmmm -> chậm)
    text = REPEATED_CHARS_REGEX.sub(r"\1", text)

    # 4. Token-level abbreviation replacement
    words = text.split()
    normalized_words = []
    for w in words:
        clean_w = w.lower().strip(".,!?:;\"'()[]{}")
        if clean_w in ABBREVIATIONS:
            # Preserve original punctuation if present
            prefix = w[: len(w) - len(w.lstrip(".,!?:;\"'()[]{}"))]
            suffix = w[len(w.rstrip(".,!?:;\"'()[]{}")) :]
            normalized_words.append(f"{prefix}{ABBREVIATIONS[clean_w]}{suffix}")
        else:
            normalized_words.append(w)

    return " ".join(normalized_words)

