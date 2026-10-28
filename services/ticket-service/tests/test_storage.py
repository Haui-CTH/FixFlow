# SPDX-License-Identifier: Apache-2.0
# DX-FSM Ticket Service – Tests for Storage Service (MinIO & Local Fallback)

import pytest
from app.services.storage_service import (
    get_minio_client,
    _minio_reachable,
    _local_upload,
    upload_attachment,
)


def test_minio_reachable():
    """Kiểm tra hàm _minio_reachable trả về boolean hợp lệ."""
    reachable = _minio_reachable(timeout=0.5)
    assert isinstance(reachable, bool)


def test_local_upload(tmp_path, monkeypatch):
    """Kiểm tra cơ chế local fallback lưu file vào thư mục an toàn."""
    monkeypatch.setattr("app.services.storage_service.STORAGE_DIR", tmp_path)
    data = b"Test local attachment content"
    filename = "sample.png"
    result_path = _local_upload(data, filename)

    assert result_path.endswith(".png")
    assert tmp_path.joinpath(result_path.split("/")[-1]).read_bytes() == data


@pytest.mark.asyncio
async def test_upload_attachment_flow(tmp_path, monkeypatch):
    """Kiểm tra upload_attachment hoạt động thành công (MinIO hoặc fallback)."""
    monkeypatch.setattr("app.services.storage_service.STORAGE_DIR", tmp_path)
    data = b"Invoice PDF document content"
    filename = "invoice.pdf"

    url, size = await upload_attachment(data, filename, "application/pdf")
    assert size == len(data)
    assert len(url) > 0
    # Hoặc qua MinIO endpoint hoặc qua local fallback
    assert "attachments" in url

