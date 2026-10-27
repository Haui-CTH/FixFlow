# DX-FSM Deployment Guide

## Yêu cầu hệ thống

- Docker Engine 24.0+
- Docker Compose v2.x
- RAM: 8GB (khuyến nghị 16GB)
- Disk: 20GB trống

## Các bước triển khai

### 1. Chuẩn bị

```bash
cd dx-fsm

# Copy .env và điền các biến bắt buộc (POSTGRES_PASSWORD, KEYCLOAK_ADMIN_PASSWORD, ...)
cp .env.example .env

# Build images
docker compose build
```

### 2. Khởi động

```bash
# Toàn bộ hệ thống
docker compose up -d

# Chỉ Open-Core trước (kiểm tra infrastructure)
docker compose -f docker-compose.yml -f docker-compose.core.yml up -d
```

Lần đầu khởi động, PostgreSQL tự chạy `core/postgres/init.sql` (schema + seed) rồi
áp dụng lần lượt các file trong `core/postgres/migrations/`. Nếu cần apply migration
thủ công trên database đang chạy:

```bash
docker compose exec -T postgres sh -c \
  'for f in /docker-entrypoint-initdb.d/0[2-9]*.sql; do psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$f"; done'
```

hoặc `make migrate`.

### 3. Kiểm tra

```bash
# Tất cả containers
docker compose ps

# Health check từng service
curl http://localhost/health                    # Gateway -> ticket-service
curl http://localhost:8001/health               # Ticket Service
curl http://localhost:8002/health               # AI Service
curl http://localhost:8003/health               # Notification Service
curl http://localhost:8080/realms/dx-fsm/.well-known/openid-configuration  # Keycloak
curl http://localhost:5678/healthz              # n8n
docker compose exec -T postgres pg_isready -U dxfsm   # PostgreSQL
```

### 4. Truy cập

| Service | URL | Ghi chú |
|---|---|---|
| Frontend | http://localhost:3000 | Đổi cổng bằng `APP_PORT` (vd: `APP_PORT=3001 docker compose up -d`) |
| API Gateway | http://localhost/api/v1 | nginx, cùng origin với frontend qua reverse proxy |
| Keycloak | http://localhost:8080 | Admin: `KEYCLOAK_ADMIN` / `KEYCLOAK_ADMIN_PASSWORD` trong `.env` |
| n8n | http://localhost:5678 | Basic auth: `N8N_BASIC_AUTH_USER` / `N8N_BASIC_AUTH_PASSWORD` |
| Mailhog (SMTP dev) | http://localhost:8025 | Nhận email từ notification-service |

Tài khoản demo (realm `dx-fsm`): `admin`, `manager`, `technician`, `customer`
(mật khẩu xem `core/keycloak/realm-export.json` hoặc README).

MinIO đang **disabled** (`profiles: ["disabled"]`); file đính kèm được lưu ở volume
`ticket_attachments` (local filesystem fallback của ticket-service).

### 5. Dừng

```bash
docker compose down
```

### 6. Xóa toàn bộ (bao gồm data)

```bash
docker compose down -v
```

## Triển khai & Cài đặt trực tiếp từ Source Code (Native / Non-Docker)

Phù hợp cho môi trường kiểm thử mã nguồn, phát triển tính năng hoặc đóng gói độc lập theo yêu cầu Hội đồng chấm thi:

### 1. Yêu cầu môi trường
- Python 3.11+
- Node.js 20+ & npm 10+
- PostgreSQL 16 (chạy local hoặc remote)
- Keycloak 24+ (cung cấp SSO/OIDC realm `dx-fsm`)

### 2. Cấu hình trước khi build (Pre-build Configuration)
Hệ thống cho phép cấu hình 100% các tham số kết nối, cổng và khóa bí mật trước khi build/chạy thông qua biến môi trường:
```bash
# Cấu hình chung hệ thống
cp .env.example .env

# Cấu hình frontend trước khi build tĩnh
cp app/.env.example app/.env
# Chỉnh sửa VITE_API_BASE_URL, VITE_KEYCLOAK_URL nếu cần đổi endpoint
```

### 3. Cài đặt CSDL từ Source
```bash
# Khởi tạo schema và bảng
psql -U dxfsm -d dxfsm -f core/postgres/init.sql

# Áp dụng các bản cập nhật migrations tuần tự (002 đến 006)
for f in core/postgres/migrations/*.sql; do
  psql -U dxfsm -d dxfsm -f "$f"
done
```

### 4. Build và Chạy Backend Microservices
Mỗi dịch vụ backend có thể chạy độc lập trong virtualenv riêng biệt:

```bash
# ─── Ticket Service (Port 8001) ───
cd services/ticket-service
python -m venv .venv && source .venv/bin/activate  # Trên Windows: .venv\Scripts\activate
pip install -r requirements.txt
export DATABASE_URL="postgresql://dxfsm:<DEMO_PASSWORD>@localhost:5432/dxfsm"
export KEYCLOAK_URL="http://localhost:8080"
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# ─── AI Service (Port 8002) ───
cd ../ai-service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export OLLAMA_BASE_URL="http://localhost:11434"
uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload

# ─── Notification Service (Port 8003) ───
cd ../notification-service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8003 --reload
```

### 5. Build và Chạy Frontend ngoài thư mục Source
Frontend sử dụng Vite + React 18, hỗ trợ build thành gói tĩnh độc lập để phục vụ ngoài thư mục source:
```bash
cd app
npm install

# Build gói tĩnh độc lập vào thư mục dist/
npm run build

# Gói sản phẩm sau build nằm tại app/dist/, có thể deploy độc lập vào:
# - Web server bất kỳ: Nginx, Apache, Caddy
# - Hoặc phục vụ nhanh:
npx serve -s dist -l 3000
```

### 6. Kiểm tra & Chạy Test Suite từ Source
Hội đồng có thể kiểm tra toàn diện chất lượng source code trực tiếp:
```bash
# Chạy toàn bộ 324 tests frontend
cd app && npm test -- --run

# Chạy unit tests backend
cd services/ticket-service && pytest tests/ -v
cd services/ai-service && pytest tests/ -v
cd services/notification-service && pytest tests/ -v
```

## Triển khai môi trường Production

1. Đổi tất cả passwords trong `.env` và thay placeholder `CHANGE_ME_*` trong realm Keycloak
2. Enable HTTPS (đặt sau reverse proxy như Nginx/Traefik) và cập nhật redirect URI của client `dx-fsm-frontend`
3. Cấu hình Keycloak production realm (không dùng `start-dev`)
4. Bật MinIO nếu cần object storage và cấu hình `MINIO_*`
5. Tích hợp provider thật cho SMS/Push (hiện là stub) và kiểm tra `SERVICE_TOKEN`
6. Backup PostgreSQL định kỳ
7. Cấu hình monitoring (Prometheus + Grafana)

## Troubleshooting

```bash
# Xem logs
docker compose logs -f postgres
docker compose logs -f ticket-service

# Restart service
docker compose restart ticket-service

# Rebuild không cache
docker compose build --no-cache
```
