"""
DX-FSM AI Service — TF-IDF text vectorizer (A5.2)
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


def tokenize(text: str) -> list[str]:
    """
    Tokenize Vietnamese text. Lowercase, strip punctuation, remove stop words.
    Simple word-level tokenization (good enough cho TF-IDF).
    """
    if not text:
        return []
    # Lowercase
    text = text.lower()
    # Remove diacritics? No — giữ nguyên để phân biệt các từ
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

    Công thức cũ log(N / (1 + df)) cho giá trị âm/0 với từ xuất hiện ở (gần) mọi tài liệu,
    làm cosine âm và tìm kiếm không ra kết quả trên KB nhỏ. Bản làm mượt luôn >= 1.
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
