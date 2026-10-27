<!-- SPDX-License-Identifier: Apache-2.0 -->
# Hướng Dẫn Cài Đặt và Khởi Chạy DX-FSM (Installation Guide)

Tài liệu hướng dẫn triển khai nền tảng **DX-FSM (Field Service Management on DX-OS)** phục vụ Hội đồng Đánh giá Cuộc thi Phần mềm Nguồn mở HaUI 2026.

---

## 📋 1. Yêu cầu Tiên quyết (Prerequisites)

| Thành phần | Phiên bản tối thiểu | Khuyến nghị | Ghi chú |
|---|---|---|---|
| **Hệ điều hành** | Linux / macOS / Windows 10/11 | Ubuntu 22.04+ / Windows WSL2 | Đã test đa nền tảng |
| **Docker Engine** | 24.0+ | 26.0+ | Bắt buộc cho triển khai container |
| **Docker Compose** | v2.20+ | v2.27+ | Compose V2 (`docker compose`) |
| **Node.js** | v20.x | v20.18+ (LTS) | Nếu build frontend thủ công |
| **Python** | 3.11 | 3.11.9 | Nếu build backend thủ công |
| **RAM** | 8 GB | 16 GB | Toàn bộ 9 microservices |
| **Ổ cứng** | 15 GB trống | 25 GB SSD | Bao gồm Docker images & volumes |

---

## 🚀 2. Phương pháp 1: Khởi chạy Nhanh bằng Docker Compose (Khuyến nghị)

Phương pháp này tự động cấu hình và khởi chạy toàn bộ 9 dịch vụ qua một lệnh duy nhất:

### Bước 1: Sao chép file cấu hình môi trường
```bash
cp .env.example .env
```
*(File `.env.example` đã cấu hình sẵn toàn bộ mật khẩu demo, secret key, cổng dịch vụ, không cần sửa đổi thêm)*.

### Bước 2: Khởi động hệ thống
```bash
# Sử dụng Makefile:
make up

# Hoặc sử dụng Docker Compose trực tiếp:
docker compose up -d --build
```

### Bước 3: Kiểm tra trạng thái dịch vụ
```bash
docker compose ps
```
Toàn bộ 9 container sẽ ở trạng thái `Up (healthy)` sau khoảng 30-45 giây.

---

## 🛠️ 3. Phương pháp 2: Khởi chạy Từng phần từ Mã nguồn (Native Source Build)

Phục vụ việc đánh giá Tiêu chí 4 (Build & Run độc lập từ mã nguồn không qua image đóng gói sẵn):

### 3.1. Khởi chạy Tầng Nền tảng (Open-Core)
```bash
docker compose up -d postgres keycloak mailhog
```

### 3.2. Chạy Frontend (React + Vite + TypeScript)
```bash
cd app
npm install
npm run build    # Build production (tsc && vite build)
npm run preview  # Preview tại http://localhost:3000
# Hoặc chạy môi trường dev:
npm run dev
```

### 3.3. Chạy Backend Microservices (FastAPI)
```bash
# Tạo môi trường ảo Python
python -m venv .venv
source .venv/bin/activate  # Trên Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Ticket Service (Port 8001)
cd services/ticket-service
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# AI Service (Port 8002)
cd services/ai-service
uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload

# Notification Service (Port 8003)
cd services/notification-service
uvicorn app.main:app --host 0.0.0.0 --port 8003 --reload
```

---

## 🌐 4. Địa chỉ Truy cập và Cổng Dịch vụ

Sau khi khởi chạy thành công, truy cập hệ thống qua các cổng sau:

| Dịch vụ | Địa chỉ URL | Cổng nội bộ | Mô tả |
|---|---|---|---|
| **Frontend Web App** | [http://localhost:3000](http://localhost:3000) | `3000` | Giao diện quản lý sự cố, Dashboard SLA |
| **API Gateway (Nginx)** | [http://localhost:80](http://localhost:80) | `80` | Cổng duy nhất mở ra ngoài theo kiến trúc DX-OS |
| **Ticket Service** | [http://localhost:8001/docs](http://localhost:8001/docs) | `8001` | Swagger API quản lý vé sự cố |
| **AI Service** | [http://localhost:8002/docs](http://localhost:8002/docs) | `8002` | Swagger API phân loại NLP & gợi ý KTV |
| **Notification Service** | [http://localhost:8003/docs](http://localhost:8003/docs) | `8003` | Swagger API thông báo đa kênh |
| **Keycloak IAM** | [http://localhost:8080](http://localhost:8080) | `8080` | Quản lý định danh SSO & RBAC (`admin` / `admin`) |
| **MailHog (Webmail)** | [http://localhost:8025](http://localhost:8025) | `8025` | Hộp thư email giả lập kiểm tra thông báo |
| **n8n Automation** | [http://localhost:5678](http://localhost:5678) | `5678` | Nền tảng tự động hóa quy trình nghiệp vụ |

---

## 🔑 5. Tài khoản Trải nghiệm Hệ thống (Demo Accounts)

Tất cả tài khoản demo sử dụng chung mật khẩu: `password`

| Tài khoản | Mật khẩu | Phân quyền (Role) | Chức năng chính |
|---|---|---|---|
| `customer` | `password` | Khách hàng | Tạo ticket sự cố, tra cứu, gửi đánh giá, phản hồi |
| `tech_lead` | `password` | Kỹ thuật viên | Nhận việc, xem chỉ dẫn AI Knowledge Base, cập nhật tiến độ |
| `manager` | `password` | Điều phối viên | Phân công KTV bằng AI, giám sát SLA, duyệt nghiệm thu |
| `admin` | `password` | Quản trị viên | Toàn quyền cấu hình hệ thống, kiểm toán hệ thống |

---

## 🧪 6. Kiểm tra & Đánh giá Tự động (Health Check & Tests)

```bash
# Kiểm tra Gateway & Services
curl -I http://localhost:80/health

# Chạy toàn bộ Unit Tests & Linting
make test
make lint

# Chạy kịch bản Demo tự động phục vụ Hội đồng
make demo-health    # Kiểm tra sức khỏe toàn bộ 9 container
make demo-ai        # Demo phân loại NLP & gợi ý phân công KTV
make demo-sla       # Demo tính toán và vi phạm SLA
```

> [!NOTE]
> Để xem chi tiết các biến môi trường và kiến trúc hạ tầng nâng cao, vui lòng tham khảo [`docs/deployment.md`](docs/deployment.md) và [`docs/architecture.md`](docs/architecture.md).

