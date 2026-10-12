# DX-FSM Core – Tầng 1: Open-Core (Headless)

## Tổng quan

Tầng 1 cung cấp các service headless cho toàn bộ hệ thống. Không có UI cho user cuối – chỉ cung cấp API và dịch vụ nền tảng.

## Các thành phần

| Service | Port | Mô tả |
|---|---|---|
| Keycloak | 8080 | Identity/SSO, quản lý user và role |
| APISIX | 9180/80 | API Gateway, routing, auth |
| PostgreSQL | 5432 | Database chính |
| MinIO | 9000/9001 | Object storage (file/ảnh) |
| n8n | 5678 | Workflow automation |

## Khởi động

```bash
# Toàn bộ stack
cd dx-fsm && docker compose up -d

# Chỉ Open-Core
docker compose up -d keycloak apisix postgres minio n8n
```

## Cấu hình

- `keycloak/realm-export.json` – Import realm + user demo tự động
- `apisix/config.yaml` – Cấu hình APISIX
- `apisix/routes.yaml` – Định nghĩa routes
- `postgres/init.sql` – Schema database + seed data
- `n8n/workflows/` – Workflow JSON exports

## Kiểm tra

```bash
# Keycloak health
curl http://localhost:8080/health/ready

# APISIX
curl http://localhost:9180/apisix/adminRoutes

# PostgreSQL
docker compose exec postgres pg_isready -U dxfsm

# MinIO
curl http://localhost:9000/minio/health/live
```
