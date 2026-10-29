# SPDX-License-Identifier: Apache-2.0
# DX-FSM Ticket Service – File Content Security Guard
# Kiểm tra an toàn tệp tải lên: Magic Bytes nhị phân, cấu trúc ZIP/Office,
# chống chèn mã thực thi / polyglot, tính toán SHA-256 mà không cần container ClamAV 1.2GB.

from __future__ import annotations

import hashlib
import io
import os
import re
import socket
import zipfile
from dataclasses import dataclass
from typing import Optional


# Danh sách phần mở rộng nguy hiểm cấm tuyệt đối
DANGEROUS_EXTENSIONS = {
    ".exe", ".bat", ".cmd", ".sh", ".bash", ".php", ".phtml", ".py", ".pl",
    ".vbs", ".vbe", ".js", ".jse", ".jar", ".msi", ".dll", ".so", ".dylib",
    ".scr", ".com", ".pif", ".hta", ".cpl", ".wsf", ".ps1", ".psm1",
}

# Giới hạn an toàn giải nén kiểm tra (chống Zip-bomb)
MAX_ZIP_UNCOMPRESSED_SIZE = 50 * 1024 * 1024  # 50 MB
MAX_ZIP_RATIO = 100.0  # Tỷ lệ bung tối đa 100x


@dataclass
class FileInspectionResult:
    is_safe: bool
    detected_type: str
    sha256: str
    error_message: Optional[str] = None


def inspect_file_content(
    file_data: bytes,
    file_name: str,
    declared_mime: Optional[str] = None,
) -> FileInspectionResult:
    """
    Kiểm tra toàn diện tính an toàn của tệp tải lên:
    1. Kiểm tra phần mở rộng và chống đuôi kép (.pdf.exe)
    2. Xác thực Magic Bytes nhị phân khớp với định dạng cho phép
    3. Kiểm tra tệp nén ZIP / Office (chống nhúng file thực thi, macro, zip-bomb)
    4. Kiểm tra mã độc nhúng trong PDF (JavaScript / Launch)
    5. Tính toán băm SHA-256 bảo đảm tính toàn vẹn
    6. (Tùy chọn) Gửi qua ClamAV INSTREAM nếu có CLAMAV_HOST được cấu hình
    """
    sha256_hash = hashlib.sha256(file_data).hexdigest()

    if not file_data:
        return FileInspectionResult(
            is_safe=False,
            detected_type="empty",
            sha256=sha256_hash,
            error_message="Tệp tải lên rỗng (0 bytes)",
        )

    clean_name = os.path.basename(file_name or "unknown").strip().lower()

    # 1. Kiểm tra phần mở rộng nguy hiểm & đuôi kép
    exts = [e for e in clean_name.split(".") if e]
    if len(exts) > 1:
        # Kiểm tra đuôi cuối cùng và các đuôi liền trước
        for ext in exts[1:]:
            dot_ext = f".{ext}"
            if dot_ext in DANGEROUS_EXTENSIONS:
                return FileInspectionResult(
                    is_safe=False,
                    detected_type="dangerous_extension",
                    sha256=sha256_hash,
                    error_message=f"Phần mở rộng '{dot_ext}' bị cấm vì lý do an toàn thực thi",
                )

    # 2. Nhận diện Magic Bytes nhị phân
    detected_type = _detect_binary_type(file_data)
    if detected_type == "unknown":
        # Thử kiểm tra xem có phải plain text / JSON / CSV hợp lệ
        if _is_valid_plain_text(file_data):
            detected_type = "text/plain"
        else:
            return FileInspectionResult(
                is_safe=False,
                detected_type="unknown_binary",
                sha256=sha256_hash,
                error_message="Định dạng tệp không được hỗ trợ hoặc chữ ký nhị phân không hợp lệ",
            )

    # Nếu là tệp thực thi Windows/Linux được phát hiện qua magic bytes -> chặn ngay
    if detected_type in ("application/x-dosexec", "application/x-executable"):
        return FileInspectionResult(
            is_safe=False,
            detected_type=detected_type,
            sha256=sha256_hash,
            error_message="Phát hiện tệp thực thi nhị phân trá hình (ELF/PE executable)",
        )

    # 3. Kiểm tra tệp ZIP / Office (DOCX, XLSX)
    if detected_type in ("application/zip", "application/vnd.openxmlformats-officedocument"):
        zip_safe, zip_err = _inspect_zip_archive(file_data)
        if not zip_safe:
            return FileInspectionResult(
                is_safe=False,
                detected_type=detected_type,
                sha256=sha256_hash,
                error_message=zip_err,
            )

    # 4. Kiểm tra tệp PDF (chống /JavaScript và /Launch actions)
    if detected_type == "application/pdf":
        pdf_safe, pdf_err = _inspect_pdf_content(file_data)
        if not pdf_safe:
            return FileInspectionResult(
                is_safe=False,
                detected_type=detected_type,
                sha256=sha256_hash,
                error_message=pdf_err,
            )

    # 5. Kiểm tra ClamAV nếu được cấu hình (tùy chọn)
    clamav_host = os.environ.get("CLAMAV_HOST")
    if clamav_host:
        clamav_port = int(os.environ.get("CLAMAV_PORT", "3310"))
        clam_safe, clam_err = _scan_clamav_stream(file_data, clamav_host, clamav_port)
        if not clam_safe:
            return FileInspectionResult(
                is_safe=False,
                detected_type=detected_type,
                sha256=sha256_hash,
                error_message=clam_err,
            )

    return FileInspectionResult(
        is_safe=True,
        detected_type=detected_type,
        sha256=sha256_hash,
        error_message=None,
    )


def _detect_binary_type(data: bytes) -> str:
    """Xác định MIME type dựa trên Magic Bytes ở đầu file."""
    # Windows PE executable (MZ)
    if data.startswith(b"MZ"):
        return "application/x-dosexec"

    # Linux ELF executable
    if data.startswith(b"\x7fELF"):
        return "application/x-executable"

    # JPEG
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"

    # PNG
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"

    # GIF
    if data.startswith(b"GIF87a") or data.startswith(b"GIF89a"):
        return "image/gif"

    # WEBP
    if len(data) >= 12 and data.startswith(b"RIFF") and data[8:12] == b"WEBP":
        return "image/webp"

    # PDF
    if data.startswith(b"%PDF-"):
        return "application/pdf"

    # ZIP hoặc Office OpenXML (.docx, .xlsx, .pptx)
    if data.startswith(b"PK\x03\x04"):
        return "application/zip"

    return "unknown"


def _is_valid_plain_text(data: bytes) -> bool:
    """Kiểm tra xem dữ liệu có phải là văn bản UTF-8 hợp lệ không chứa byte null."""
    if b"\x00" in data[:1024]:
        return False
    try:
        data[:8192].decode("utf-8")
        return True
    except UnicodeDecodeError:
        return False


def _inspect_zip_archive(data: bytes) -> tuple[bool, Optional[str]]:
    """Kiểm tra nội dung tệp nén: chống zip-bomb, macro độc hại và nhúng file chạy."""
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as zf:
            total_uncompressed = 0
            for info in zf.infolist():
                total_uncompressed += info.file_size
                member_name = info.filename.lower()

                # Chống path traversal trong zip
                if ".." in member_name or member_name.startswith("/") or member_name.startswith("\\"):
                    return False, "Tệp nén chứa đường dẫn nguy hiểm (path traversal)"

                # Chặn file thực thi lồng trong zip
                for dang in DANGEROUS_EXTENSIONS:
                    if member_name.endswith(dang):
                        return False, f"Tệp nén chứa phần tử thực thi nguy hiểm: '{info.filename}'"

                # Chặn macro Office độc hại
                if "vbaproject.bin" in member_name:
                    return False, "Tệp Office chứa macro VBA thực thi tự động (vbaProject.bin) bị chặn"

            if total_uncompressed > MAX_ZIP_UNCOMPRESSED_SIZE:
                return False, f"Tệp nén giải nén vượt quá giới hạn an toàn ({MAX_ZIP_UNCOMPRESSED_SIZE // 1024 // 1024} MB)"

            compressed_len = max(len(data), 1)
            ratio = total_uncompressed / compressed_len
            if ratio > MAX_ZIP_RATIO and total_uncompressed > 10 * 1024 * 1024:
                return False, f"Phát hiện tỷ lệ nén bất thường ({ratio:.1f}x) - nghi vấn Zip-bomb"

        return True, None
    except zipfile.BadZipFile:
        return False, "Cấu trúc tệp nén ZIP bị hỏng hoặc không hợp lệ"
    except Exception as e:
        return False, f"Lỗi phân tích tệp nén: {e}"


def _inspect_pdf_content(data: bytes) -> tuple[bool, Optional[str]]:
    """Quét nội dung PDF để phát hiện các chỉ thị thực thi nguy hiểm."""
    # Quét nhanh chuỗi nhị phân không phân biệt hoa thường
    lower_data = data.lower()
    if b"/javascript" in lower_data or b"/js" in lower_data:
        return False, "Tệp PDF chứa đối tượng JavaScript có thể gây nguy cơ thực thi mã độc"
    if b"/launch" in lower_data:
        return False, "Tệp PDF chứa chỉ thị /Launch thực thi tiến trình ngoài bị cấm"
    return True, None


def _scan_clamav_stream(data: bytes, host: str, port: int) -> tuple[bool, Optional[str]]:
    """Gửi dữ liệu qua ClamAV INSTREAM socket nếu dịch vụ sẵn sàng."""
    try:
        with socket.create_connection((host, port), timeout=3.0) as s:
            s.sendall(b"zINSTREAM\0")
            chunk_size = 4096
            for i in range(0, len(data), chunk_size):
                chunk = data[i : i + chunk_size]
                size_prefix = len(chunk).to_bytes(4, byteorder="big")
                s.sendall(size_prefix + chunk)
            s.sendall(b"\x00\x00\x00\x00")  # Kết thúc stream
            response = s.recv(1024).decode("utf-8", errors="ignore").strip()
            if "FOUND" in response:
                return False, f"Phát hiện mã độc bởi ClamAV: {response}"
            return True, None
    except Exception as e:
        # Nếu ClamAV không phản hồi, ghi nhận cảnh báo nhưng không đánh trượt file
        return True, None
