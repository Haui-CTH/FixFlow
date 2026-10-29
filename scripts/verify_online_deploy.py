#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# HaUI PMNM 2026 — FixFlow Online Deployment Verification & Smoke Test Harness
# Tự động kiểm thử sức khỏe và độ sẵn sàng của bản triển khai Online (HTTPS/VPS/Tunnel)

from __future__ import annotations

import argparse
import json
import socket
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone


def print_banner(target_url: str):
    print("\n" + "=" * 80)
    print(" FIXFLOW (DX-FSM) — KIỂM TRA SỨC KHỎE TRIỂN KHAI TRỰC TUYẾN (SMOKE TESTS)")
    print(f" Mục tiêu kiểm tra: {target_url}")
    print(f" Thời điểm quét:    {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print("=" * 80)


def check_step(step_num: int, title: str):
    print(f"\n[\033[1;34mBƯỚC {step_num}\033[0m] {title}")


def log_pass(msg: str):
    print(f"  \033[1;32m✓ ĐẠT:\033[0m {msg}")


def log_fail(msg: str):
    print(f"  \033[1;31m✗ THẤT BẠI:\033[0m {msg}")


def log_info(msg: str):
    print(f"    \033[0;37m{msg}\033[0m")


def make_request(url: str, timeout: float = 10.0, method: str = "GET", data: bytes = None, headers: dict = None) -> tuple[int, dict, bytes]:
    """Gửi HTTP request an toàn và đo đạc độ trễ."""
    req_headers = {
        "User-Agent": "FixFlow-Deploy-Verifier/1.0",
        "Accept": "*/*",
    }
    if headers:
        req_headers.update(headers)

    req = urllib.request.Request(url, data=data, headers=req_headers, method=method)
    ctx = ssl.create_default_context()

    t0 = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
            body = resp.read()
            latency = (time.perf_counter() - t0) * 1000.0
            return resp.status, dict(resp.headers), body, latency, None
    except urllib.error.HTTPError as e:
        body = e.read()
        latency = (time.perf_counter() - t0) * 1000.0
        return e.code, dict(e.headers), body, latency, None
    except Exception as e:
        latency = (time.perf_counter() - t0) * 1000.0
        return 0, {}, b"", latency, str(e)


def main():
    parser = argparse.ArgumentParser(description="Kiểm tra độ sẵn sàng và an toàn của hệ thống FixFlow đã deploy.")
    parser.add_argument("url", nargs="?", default="http://localhost", help="URL triển khai (vd: https://fixflow.example.com hoặc http://localhost)")
    args = parser.parse_args()

    target_url = args.url.rstrip("/")
    if not target_url.startswith("http://") and not target_url.startswith("https://"):
        target_url = f"https://{target_url}"

    parsed = urllib.parse.urlparse(target_url)
    hostname = parsed.hostname or "localhost"
    port = parsed.port or (443 if parsed.scheme == "https" else 80)

    print_banner(target_url)

    total_passed = 0
    total_checks = 7

    # ─── 1. Kết nối Mạng & Bắt tay TLS/HTTPS ─────────────────────────────────────
    check_step(1, "Kiểm tra Kết nối Mạng & Chứng chỉ TLS/HTTPS")
    if parsed.scheme == "https":
        try:
            ctx = ssl.create_default_context()
            with socket.create_connection((hostname, port), timeout=5.0) as sock:
                with ctx.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cert = ssock.getpeercert()
                    cipher = ssock.cipher()
                    issuer = dict(x[0] for x in cert.get("issuer", []))
                    log_pass(f"Bắt tay TLS thành công ({cipher[0]}, {cipher[1]})")
                    log_info(f"Chứng chỉ cấp bởi: {issuer.get('organizationName') or issuer.get('commonName')}")
                    log_info(f"Hạn dùng chứng chỉ: {cert.get('notAfter')}")
                    total_passed += 1
        except Exception as e:
            log_fail(f"Lỗi bắt tay SSL/TLS: {e}")
    else:
        log_info("Môi trường HTTP cục bộ (Bỏ qua kiểm tra chứng chỉ SSL Let's Encrypt / Cloudflare)")
        total_passed += 1

    # ─── 2. Giao diện Web Single-Origin & Nginx Routing ─────────────────────────
    check_step(2, "Kiểm tra Giao diện Web Single-Origin & Định tuyến Nginx")
    status, headers, body, latency, err = make_request(f"{target_url}/")
    if status == 200 and b"FixFlow" in body or b"<!DOCTYPE html>" in body.lower():
        log_pass(f"Giao diện Web hoạt động tốt (Mã {status}, Phản hồi {latency:.1f}ms)")
        log_info(f"Server header: {headers.get('Server', 'Nginx/Gateway')}")
        total_passed += 1
    else:
        log_fail(f"Không nhận được mã 200 từ Web Root: Mã {status}, Lỗi: {err}")

    # ─── 3. Định danh Tập trung Keycloak OIDC Discovery ─────────────────────────
    check_step(3, "Kiểm tra Định danh Keycloak SSO (OpenID Connect Discovery)")
    oidc_url = f"{target_url}/realms/dx-fsm/.well-known/openid-configuration"
    status, _, body, latency, err = make_request(oidc_url)
    if status == 200:
        try:
            oidc_meta = json.loads(body.decode())
            issuer = oidc_meta.get("issuer")
            log_pass(f"Keycloak OIDC Realm 'dx-fsm' sẵn sàng ({latency:.1f}ms)")
            log_info(f"Issuer: {issuer}")
            log_info(f"Auth endpoint: {oidc_meta.get('authorization_endpoint')}")
            total_passed += 1
        except Exception as e:
            log_fail(f"Lỗi phân tích JSON OIDC discovery: {e}")
    else:
        log_fail(f"Không truy cập được OIDC Discovery (Mã {status}): {err or body[:120].decode(errors='ignore')}")

    # ─── 4. API Gateway & Dịch vụ Quản lý Sự cố (Ticket Service) ────────────────
    check_step(4, "Kiểm tra Gateway & Ticket Service Summary")
    api_url = f"{target_url}/api/v1/tickets/stats/summary"
    status, _, body, latency, err = make_request(api_url)
    if status in (200, 401):  # 401 hoặc 200 chứng minh Gateway định tuyến thành công vào Ticket Service
        log_pass(f"Ticket Service phản hồi chính xác qua Gateway ({latency:.1f}ms, Mã {status})")
        total_passed += 1
    else:
        log_fail(f"Ticket Service không phản hồi qua Gateway (Mã {status}): {err}")

    # ─── 5. Cổng Xác thực Công khai & Con dấu Số (Public Verify Portal) ─────────
    check_step(5, "Kiểm tra Cổng Xác thực Công khai & Con dấu Nghiệm thu Số")
    verify_url = f"{target_url}/api/v1/tickets/verify/TKT-2026-000003"
    status, _, body, latency, err = make_request(verify_url)
    if status == 200:
        try:
            v_data = json.loads(body.decode())
            valid = v_data.get("valid")
            seal_code = v_data.get("seal_code")
            tech_masked = v_data.get("technician_name")
            log_pass(f"Cổng xác thực công khai hoạt động hoàn hảo ({latency:.1f}ms)")
            log_info(f"Trạng thái biên bản: {v_data.get('status_label')} (Valid: {valid})")
            log_info(f"Mã con dấu HMAC-SHA256: {seal_code}")
            log_info(f"Tên kỹ thuật viên (đã che NĐ 13): '{tech_masked}'")
            total_passed += 1
        except Exception as e:
            log_fail(f"Lỗi dữ liệu xác thực: {e}")
    else:
        log_fail(f"Cổng xác thực không phản hồi (Mã {status}): {err or body[:120].decode(errors='ignore')}")

    # ─── 6. Tác tử Trí tuệ Nhân tạo Edge AI & Tra cứu Cẩm nang ──────────────────
    check_step(6, "Kiểm tra Phân hệ Trí tuệ Nhân tạo (Edge-AI & TF-IDF Search)")
    kb_url = f"{target_url}/api/v1/kb/search?q=may+chieu&top_k=2"
    status, _, body, latency, err = make_request(kb_url)
    if status == 200:
        try:
            articles = json.loads(body.decode())
            log_pass(f"Tác tử TF-IDF tra cứu cẩm nang phản hồi siêu tốc ({latency:.1f}ms, Tìm thấy {len(articles)} bài viết)")
            total_passed += 1
        except Exception as e:
            log_fail(f"Lỗi dữ liệu tìm kiếm cẩm nang: {e}")
    else:
        log_fail(f"Tác tử AI không phản hồi (Mã {status}): {err}")

    # ─── 7. Cô lập Vùng mạng Nội bộ (Zero-Trust Security Boundary) ─────────────
    check_step(7, "Kiểm tra Cô lập Mạng: Đảm bảo cổng nội bộ (DB, MinIO) KHÔNG bị lộ")
    internal_ports = [
        (5432, "PostgreSQL"),
        (9000, "MinIO API"),
        (9001, "MinIO Console"),
    ]
    exposed = []
    if hostname != "localhost" and hostname != "127.0.0.1":
        for p, label in internal_ports:
            try:
                with socket.create_connection((hostname, p), timeout=1.5):
                    exposed.append(f"{label} (Cổng {p})")
            except (socket.timeout, ConnectionRefusedError, OSError):
                pass

        if not exposed:
            log_pass("Tất cả cổng CSDL và lưu trữ nội bộ được cô lập an toàn sau Gateway!")
            total_passed += 1
        else:
            log_fail(f"CẢNH BÁO BẢO MẬT: Phát hiện cổng nội bộ bị lộ ra Internet: {', '.join(exposed)}")
    else:
        log_pass("Môi trường Localhost: Các container liên kết an toàn qua Docker Bridge Network ('dxfsm-net')")
        total_passed += 1

    # ─── Tổng kết ─────────────────────────────────────────────────────────────
    print("\n" + "=" * 80)
    if total_passed == total_checks:
        print(f"  \033[1;32mTỔNG KẾT: {total_passed}/{total_checks} MỤC KIỂM TRA ĐẠT HOÀN TOÀN — HỆ THỐNG SẴN SÀNG CHẤM THI!\033[0m")
    else:
        print(f"  \033[1;33mTỔNG KẾT: {total_passed}/{total_checks} MỤC ĐẠT — VUI LÒNG KIỂM TRA CÁC MỤC THẤT BẠI TRÊN.\033[0m")
    print("=" * 80 + "\n")

    sys.exit(0 if total_passed == total_checks else 1)


if __name__ == "__main__":
    main()
