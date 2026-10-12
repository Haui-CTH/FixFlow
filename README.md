# DX-FSM – Field Service Management Platform

**Nền tảng Quản lý Dịch vụ Thực địa trên nền tảng DX-OS Open-Core**

![Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ed)
![Python](https://img.shields.io/badge/Python-3.11+-3776ab)
![Vue](https://img.shields.io/badge/Vue-3-4fc08d)

## Mục lục

- [Giới thiệu](#giới-thiệu)
- [Kiến trúc](#kiến-trúc)
- [Tính năng](#tính-năng)
- [Tech Stack](#tech-stack)
- [Cài đặt nhanh](#cài-đặt-nhanh)
- [Tài khoản demo](#tài-khoản-demo)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Tài liệu](#tài-liệu)
- [Đóng góp](#đóng-góp)
- [Giấy phép](#giấy-phép)

---

## Giới thiệu

DX-FSM là hệ thống quản lý dịch vụ thực địa, được xây dựng theo kiến trúc **DX-OS Open-Core 3 tầng**:

- **Tầng 1 – Open-Core (Headless):** Keycloak, APISIX, PostgreSQL, MinIO, n8n
- **Tầng 2 – H-P-D-I:** Không gian Human, Process, Data, Intelligence
- **Tầng 3 – Ứng dụng:** Vue 3 SPA cho Customer, Technician, Manager

Bài toán: Doanh nghiệp cung cấp dịch vụ kỹ thuật (lắp đặt, bảo trì, sửa chữa) cần một nền tảng thống nhất thay thế Excel và tin nhắn rời rạc.

---

## Kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│                   TẦNG 3: ỨNG DỤNG NGHIỆP VỤ              │
│  Customer App │ KTV Mobile │ Manager Dashboard              │
│                    (Vue 3 SPA)                              │
├─────────────────────────────┬───────────────────────────────┤
│        TẦNG 2: H-P-D-I    │                               │
│  H: User/Profile           │ P: Ticket Workflow            │
│  D: Dashboard/KPI         │ I: AI Classify/Recommend      │
├─────────────────────────────┴───────────────────────────────┤
│                    TẦNG 1: DX-OS OPEN-CORE (HEADLESS)       │
│  Keycloak (SSO) │ APISIX (Gateway) │ PostgreSQL (DB)     │
│  MinIO (Files) │ n8n (Workflow) │ Ollama (AI)            │
└─────────────────────────────────────────────────────────────┘
```

Xem chi tiết: [docs/docs/architecture/overview.md](docs/docs/architecture/overview.md)

---

## Tính năng

### Tầng 1 – Open-Core
- [x] **Identity/SSO** với Keycloak – JWT token, RBAC
- [x] **API Gateway** với Apache APISIX – routing, auth, rate limit
- [x] **Database** PostgreSQL – dữ liệu quan hệ
- [x] **File Storage** với MinIO – ảnh hiện trường
- [x] **Workflow Engine** với n8n – ticket intake → assign → process → close
- [x] **AI Service** với Ollama – phân loại ticket tự động

### Tầng 2 – H-P-D-I
- [x] **H – Human:** Quản lý user, profile, team
- [x] **P – Process:** Quy trình ticket có trạng thái, người tạo, người xử lý, timestamp
- [x] **D – Data:** Dashboard, KPI, thống kê real-time
- [x] **I – Intelligence:** AI phân loại ticket, gợi ý kỹ thuật viên

### Tầng 3 – Ứng dụng
- [x] **Customer Portal:** Tạo ticket, theo dõi trạng thái
- [x] **Technician Portal:** Nhận ticket, cập nhật tiến độ, upload ảnh
- [x] **Manager Dashboard:** Tổng hợp KPI, phân công thủ công

---

## Tech Stack

| Thành phần | Công nghệ | Giấy phép |
|---|---|---|
| Identity/SSO | Keycloak | Apache-2.0 |
| API Gateway | Apache APISIX | Apache-2.0 |
| Database | PostgreSQL 16 | PostgreSQL |
| File Storage | MinIO | AGPL-3.0 |
| Workflow | n8n | Elastic-2.0 |
| Backend API | FastAPI (Python 3.11) | MIT |
| AI Service | Ollama + Llama 3.2 | MIT |
| Frontend | Vue 3 + Vite + TypeScript | MIT |
| Orchestration | Docker Compose | Apache-2.0 |

Xem chi tiết: [DEPENDENCIES.md](DEPENDENCIES.md)

---

## Cài đặt nhanh

### Yêu cầu

- Docker & Docker Compose v2
- Git
- 8GB RAM (tối thiểu 4GB)
- 20GB disk

### Các bước

```bash
# 1. Clone repository
git clone https://github.com/<team>/dx-fsm.git
cd dx-fsm

# 2. Copy env file
cp .env.example .env

# 3. (Tùy chọn) Chỉnh sửa .env nếu cần
# Mặc định đã đủ cho demo

# 4. Khởi động toàn bộ hệ thống
docker compose up -d

# 5. Đợi services khởi động (~2-3 phút)
# Kiểm tra trạng thái:
docker compose ps

# 6. Truy cập các service
# Frontend:      http://localhost:3000
# Keycloak:       http://localhost:8080/auth (admin/admin123)
# API Docs:       http://localhost:8000/docs
# n8n Workflow:  http://localhost:5678
# MinIO Console:  http://localhost:9001 (minioadmin/minioadmin)
# Grafana:       http://localhost:3001 (admin/admin123)
```

### Build từ source

```bash
# Backend (FastAPI)
cd services/ticket-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001

# Frontend (Vue 3)
cd app
npm install
npm run dev

# AI Service
cd services/ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8002
```

---

## Tài khoản demo

| Role | Username | Password | Mô tả |
|---|---|---|---|
| Customer | `customer@haui.vn` | `customer123` | Tạo ticket, theo dõi trạng thái |
| Technician | `technician@haui.vn` | `tech123` | Nhận, xử lý, đóng ticket |
| Manager | `manager@haui.vn` | `manager123` | Dashboard, phân công thủ công |
| Admin | `admin@haui.vn` | `admin123` | Quản trị Keycloak |

---

## Cấu trúc dự án

```
dx-fsm/
├── core/                    # Tầng 1: Open-Core (Headless)
│   ├── keycloak/          # SSO + RBAC
│   ├── apisix/            # API Gateway
│   ├── postgres/          # Database schema
│   ├── minio/             # File storage
│   └── n8n/               # Workflow engine
├── services/               # Tầng 2: Microservices
│   ├── ticket-service/    # Core API (FastAPI)
│   ├── ai-service/        # AI/ML (FastAPI + Ollama)
│   └── notification-service/
├── app/                   # Tầng 3: Vue 3 Frontend
├── docs/                  # Tài liệu Docusaurus
├── scripts/               # Utility scripts
└── docker-compose.yml    # Orchestration
```

---

## Tài liệu

| Tài liệu | Mô tả |
|---|---|
| [docs/docs/architecture/overview.md](docs/docs/architecture/overview.md) | Tổng quan kiến trúc |
| [docs/docs/setup/installation.md](docs/docs/setup/installation.md) | Hướng dẫn cài đặt chi tiết |
| [docs/docs/demo/demo-script.md](docs/docs/demo/demo-script.md) | Kịch bản demo |
| [docs/docs/api/endpoints.md](docs/docs/api/endpoints.md) | Tài liệu API |
| [reports/technical-report.md](reports/technical-report.md) | Báo cáo kỹ thuật |

---

## Đóng góp

Xem [CONTRIBUTING.md](CONTRIBUTING.md) để biết quy trình đóng góp.

---

## Giấy phép

Dự án này được phân phối theo **Apache License 2.0**. Xem file [LICENSE](LICENSE) để biết chi tiết.

---

**DX-FSM Team – OLP 2026 – HaUI**
