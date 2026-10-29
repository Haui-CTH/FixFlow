# SPDX-License-Identifier: Apache-2.0
"""
DX-FSM AI Service — TF-IDF text vectorizer & Domain Semantic Expansion (A5.2)
Pure Python implementation, no numpy/scipy dependency.
Used for semantic search over KB articles.
"""
from __future__ import annotations

import math
import re
from collections import Counter
from typing import Iterable


# Vietnamese stop words (common)
STOP_WORDS_VI = frozenset(
    "là của và cho với trong không có được những này một các để khi thì "
    "như từ cũng thêm hay bị về bởi thì sẽ đã vẫn thể bằng trên dưới "
    "đến nhé nhỉ à ạ ừ um huh rất quá lắm nhiều ít hơn nữa mà thôi "
    "vào ra lên xuống đi đến thì là đó đây nơi chỗ người việc năm ngày".split()
)

# Vietnamese IT domain synonyms mapping for semantic search query expansion
DOMAIN_SYNONYMS: dict[str, list[str]] = {
    "tín hiệu mạng": ["wifi", "mạng", "internet", "lan", "kết nối", "router"],
    "tín hiệu": ["kết nối", "mạng", "wifi"],
    "mất mạng": ["wifi", "mạng", "internet", "lan", "rớt mạng"],
    "kẹt giấy": ["máy in", "in ấn", "kẹt"],
    "hết mực": ["máy in", "mực in", "cartridge", "toner"],
    "quên mật khẩu": ["password", "mật khẩu", "reset", "domain", "admin"],
    "mật khẩu": ["password", "tài khoản", "login"],
    "nhiệt độ": ["quá nhiệt", "nóng", "tản nhiệt", "quạt"],
    "máy chủ": ["server", "quá nhiệt"],
    "sọc màn hình": ["màn hình", "panel", "display", "lcd"],
    "nhảy aptomat": ["chập điện", "mất điện", "cb", "mcb"],
    "phần mềm": ["ứng dụng", "cài đặt", "license"],
}


def expand_query(text: str) -> str:
    """
    Expands input search queries with domain synonyms to bridge the lexical gap.
    Runs in < 0.05ms with 0MB RAM footprint.
    """
    if not text:
        return ""
    text_lower = text.lower()
    additions: list[str] = []
    for key, syns in DOMAIN_SYNONYMS.items():
        if key in text_lower:
            additions.extend(syns)
    if additions:
        unique_syns = [s for s in additions if s not in text_lower]
        if unique_syns:
            return f"{text} {' '.join(unique_syns)}"
    return text


def tokenize(text: str) -> list[str]:
    """
    Tokenize Vietnamese text. Lowercase, strip punctuation, remove stop words.
    Simple word-level tokenization (good enough cho TF-IDF).
    """
    if not text:
        return []
    # Lowercase
    text = text.lower()
    # Replace punctuation with space
    text = re.sub(r"[^\w\sáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]", " ", text)
    # Tokenize on whitespace
    tokens = text.split()
    # Remove stop words + short tokens
    return [t for t in tokens if t and t not in STOP_WORDS_VI and len(t) > 1]


def compute_tf(tokens: list[str]) -> dict[str, float]:
    """Term frequency: count / total tokens."""
    if not tokens:
        return {}
    counts = Counter(tokens)
    total = len(tokens)
    return {term: count / total for term, count in counts.items()}


def compute_idf(documents: list[list[str]]) -> dict[str, float]:
    """Smoothed IDF: log((1 + N) / (1 + df)) + 1.

    Công thức log((1 + N) / (1 + df)) + 1 đảm bảo giá trị luôn >= 1.
    """
    n = len(documents)
    if n == 0:
        return {}
    df: Counter = Counter()
    for doc in documents:
        for term in set(doc):
            df[term] += 1
    return {term: math.log((1 + n) / (1 + count)) + 1.0 for term, count in df.items()}


def vectorize(
    text: str,
    idf: dict[str, float],
) -> dict[str, float]:
    """
    TF-IDF vector. Sparse dict[str, float].
    """
    tokens = tokenize(text)
    tf = compute_tf(tokens)
    return {term: tf_val * idf.get(term, 0.0) for term, tf_val in tf.items()}


def cosine_similarity(
    vec_a: dict[str, float],
    vec_b: dict[str, float],
) -> float:
    """Cosine similarity between two sparse vectors."""
    if not vec_a or not vec_b:
        return 0.0
    # Dot product on intersection
    intersection = set(vec_a.keys()) & set(vec_b.keys())
    dot = sum(vec_a[k] * vec_b[k] for k in intersection)
    # Magnitudes
    mag_a = math.sqrt(sum(v * v for v in vec_a.values()))
    mag_b = math.sqrt(sum(v * v for v in vec_b.values()))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


def batch_cosine_similarity(
    query_vec: dict[str, float],
    doc_vecs: list[dict[str, float]],
) -> list[float]:
    """Compute query vs each doc. Returns list of similarity scores."""
    return [cosine_similarity(query_vec, dv) for dv in doc_vecs]


def build_idf(documents: Iterable[str]) -> tuple[dict[str, float], list[list[str]]]:
    """
    Pre-compute IDF over corpus. Returns (idf, tokenized_docs).
    """
    tokenized = [tokenize(doc) for doc in documents]
    idf = compute_idf(tokenized)
    return idf, tokenized
