# SPDX-License-Identifier: Apache-2.0
# DX-FSM Ticket Service – Storage Service
# Hỗ trợ 2 backend: MinIO (production) và local filesystem (khi MinIO disabled).

import uuid
from io import BytesIO
from pathlib import Path
from typing import Optional

from minio import Minio, S3Error
from app.config import get_settings

settings = get_settings()

# ─── MinIO client ─────────────────────────────────────────────

def get_minio_client() -> Optional[Minio]:
    """Trả về MinIO client nếu endpoint có thể kết nối, None nếu fail."""
    try:
        client = Minio(
            settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=False,
        )
        return client
    except Exception:
        return None


_MINIO_CHECK: tuple[float, bool] = (0.0, False)  # (thời điểm kiểm tra, kết quả)
_MINIO_CHECK_TTL = 60.0


def _minio_reachable(timeout: float = 1.0) -> bool:
    """Kiểm tra nhanh MinIO có kết nối được không (tránh retry rất lâu của minio-py khi service tắt).

    Kết quả được nhớ 60 giây: khi MinIO tắt, phân giải DNS thất bại mất ~4 giây mỗi lần,
    không nên trả giá đó cho từng lần upload.
    """
    import socket
    import time

    global _MINIO_CHECK
    now = time.monotonic()
    checked_at, ok = _MINIO_CHECK
    if checked_at and now - checked_at < _MINIO_CHECK_TTL:
        return ok

    host, _, port = settings.minio_endpoint.partition(":")
    try:
        with socket.create_connection((host, int(port or 9000)), timeout=timeout):
            ok = True
    except OSError:
        ok = False
    _MINIO_CHECK = (now, ok)
    return ok


def _minio_upload(data: bytes, object_name: str, content_type: str) -> str:
    """Upload lên MinIO, raise S3Error nếu fail."""
    if not _minio_reachable():
        raise ConnectionError("MinIO unreachable")
    client = get_minio_client()
    if not client:
        raise S3Error("MinIO unavailable")

    data_length = len(data)
    # MinIO put_object yêu cầu file-like object, không phải bytes
    client.put_object(
        settings.minio_bucket,
        object_name,
        BytesIO(data),
        data_length,
        content_type=content_type,
    )
    return f"{settings.minio_endpoint}/{settings.minio_bucket}/{object_name}"


# ─── Local filesystem fallback ─────────────────────────────────

STORAGE_DIR = Path("/data/attachments")
STORAGE_DIR.mkdir(parents=True, exist_ok=True)


def _local_upload(data: bytes, file_name: str) -> str:
    """Upload vào filesystem local (khi MinIO disabled)."""
    ext = Path(file_name).suffix
    safe_name = f"{uuid.uuid4().hex}{ext}"
    file_path = STORAGE_DIR / safe_name
    file_path.write_bytes(data)
    return str(file_path)


# ─── Public API ────────────────────────────────────────────────

async def upload_attachment(
    file_data: bytes,
    file_name: str,
    content_type: str,
) -> tuple[str, int]:
    """
    Upload attachment. Thử MinIO trước, fallback sang filesystem local.

    Trả về (url, size).
    Khi MinIO up:  url = "http://minio:9000/attachments/<object_name>"
    Khi MinIO down: url = "/data/attachments/<uuid>.ext"
    """
    object_name = f"{uuid.uuid4().hex}_{file_name}"
    size = len(file_data)

    try:
        url = _minio_upload(file_data, object_name, content_type)
    except (S3Error, Exception):
        # MinIO unavailable (network, DNS, bucket missing, etc.) → local fallback
        url = _local_upload(file_data, file_name)

    return url, size
