<!-- SPDX-License-Identifier: Apache-2.0 -->
# DX-FSM Core – Tầng 1: Open-Core (Headless)

## Tổng quan

Tầng 1 cung cấp các service headless cho toàn bộ hệ thống theo kiến trúc mở DX-OS. Không có UI cho user cuối – chỉ cung cấp API và dịch vụ nền tảng.

## Các thành phần

| Service | Port | Mô tả |
|---|---|---|
| Keycloak | 8080 | Identity/SSO, quản lý user và role |
| Nginx Gateway | 80 | API Gateway, routing, SSL/TLS, reverse proxy |
| PostgreSQL | 5432 | Database chính |
| MinIO | 9000/9001 | Object storage (file/ảnh) |
| n8n | 5678 | Workflow automation |

## Khởi động

```bash
# Toàn bộ stack
docker compose up -d

# Chỉ Open-Core
docker compose up -d keycloak gateway postgres minio n8n
```

## Cấu hình

- `keycloak/realm-export.json` – Import realm + user demo tự động
- `nginx/nginx.conf` – Cấu hình reverse proxy và bảo mật cho API Gateway
- `postgres/init.sql` – Schema database + seed data
- `postgres/migrations/` – Các bản cập nhật schema và dữ liệu mẫu thực tế
- `n8n/workflows/` – Workflow JSON exports

## Kiểm tra

```bash
# Keycloak health
curl http://localhost:8080/health/ready

# API Gateway health
curl -I http://localhost:80/health

# PostgreSQL
docker compose exec postgres pg_isready -U dxfsm

# MinIO
curl http://localhost:9000/minio/health/live
```
