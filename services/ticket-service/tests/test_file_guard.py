# SPDX-License-Identifier: Apache-2.0
# DX-FSM Ticket Service – Tests for File Content Security Guard

import io
import zipfile
import pytest
from app.services.file_guard import inspect_file_content, DANGEROUS_EXTENSIONS


def test_safe_jpeg_image():
    # Valid JPEG magic bytes \xFF\xD8\xFF
    data = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00"
    res = inspect_file_content(data, "hien_truong.jpg", "image/jpeg")
    assert res.is_safe is True
    assert res.detected_type == "image/jpeg"
    assert len(res.sha256) == 64


def test_safe_png_image():
    # Valid PNG magic bytes \x89PNG\r\n\x1a\n
    data = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    res = inspect_file_content(data, "so_do_mang.png", "image/png")
    assert res.is_safe is True
    assert res.detected_type == "image/png"


def test_safe_pdf_document():
    # Valid PDF magic bytes %PDF-
    data = b"%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< >>\n%%EOF"
    res = inspect_file_content(data, "bien_ban_nghiem_thu.pdf", "application/pdf")
    assert res.is_safe is True
    assert res.detected_type == "application/pdf"


def test_safe_plain_text():
    data = "Nhật ký kiểm tra thiết bị phòng máy Lab 402 HaUI".encode("utf-8")
    res = inspect_file_content(data, "nhat_ky.txt", "text/plain")
    assert res.is_safe is True
    assert res.detected_type == "text/plain"


def test_safe_zip_archive():
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("log.txt", "Server rebooted at 08:00")
        zf.writestr("data.csv", "id,status\n1,ok")
    data = buf.getvalue()

    res = inspect_file_content(data, "logs.zip", "application/zip")
    assert res.is_safe is True
    assert res.detected_type == "application/zip"


def test_reject_dangerous_extension():
    data = b"echo 'hacked'"
    res = inspect_file_content(data, "script.sh")
    assert res.is_safe is False
    assert "bị cấm" in res.error_message


def test_reject_double_extension():
    # report.pdf.exe
    data = b"%PDF-1.4\nsome text"
    res = inspect_file_content(data, "report.pdf.exe")
    assert res.is_safe is False
    assert "bị cấm" in res.error_message


def test_reject_disguised_executable():
    # MZ header named as photo.jpg
    data = b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00"
    res = inspect_file_content(data, "photo.jpg", "image/jpeg")
    assert res.is_safe is False
    assert "thực thi nhị phân trá hình" in res.error_message


def test_reject_zip_with_executable_inside():
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("safe.txt", "hello")
        zf.writestr("payload.bat", "@echo off\ndir")
    data = buf.getvalue()

    res = inspect_file_content(data, "tai_lieu.zip", "application/zip")
    assert res.is_safe is False
    assert "chứa phần tử thực thi nguy hiểm" in res.error_message


def test_reject_office_macro_vba():
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("[Content_Types].xml", "<xml></xml>")
        zf.writestr("word/vbaProject.bin", b"\xd0\xcf\x11\xe0")
    data = buf.getvalue()

    res = inspect_file_content(data, "bien_ban.docx")
    assert res.is_safe is False
    assert "vbaProject.bin" in res.error_message


def test_reject_pdf_with_javascript():
    data = b"%PDF-1.4\n<< /Type /Action /S /JavaScript /JS (app.alert('XSS')) >>\n%%EOF"
    res = inspect_file_content(data, "malicious.pdf", "application/pdf")
    assert res.is_safe is False
    assert "JavaScript" in res.error_message


def test_reject_empty_file():
    res = inspect_file_content(b"", "empty.txt")
    assert res.is_safe is False
    assert "rỗng" in res.error_message

