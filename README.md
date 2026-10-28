# FixFlow — Field Service Management Platform

> **Nền tảng Quản lý Dịch vụ Kỹ thuật Thực địa trên Lõi mở DX-OS** — Hợp nhất quy trình tiếp nhận sự cố, phân công kỹ thuật viên thông minh bằng AI, tra cứu cẩm nang kỹ thuật Knowledge Base và giám sát vận hành toàn diện theo kiến trúc 3 tầng H-P-D-I.

![Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ed)
![Python](https://img.shields.io/badge/Python-3.11+-3776ab)
![React](https://img.shields.io/badge/React-18-61dafb)
![Tests](https://img.shields.io/badge/Tests-332%20passed-success)

**Đội thi:** HaUI · **Trường:** Trường Công nghệ Thông tin và Truyền thông, Đại học Công nghiệp Hà Nội  
Sản phẩm tham gia thi đấu **Olympic Tin học Sinh viên Việt Nam 2026 — Khối Phần mềm Nguồn mở (OLP PMNM 2026)**, chủ đề *DX-OS Open-Core* (VFOSSA).

**Dùng thử trực tuyến:** <https://phentermine-exec-calgary-outreach.trycloudflare.com> · Hoặc chạy tại máy: `http://localhost/`

**Đọc nhanh:** [Giới thiệu](#giới-thiệu) · [Kiến trúc](#kiến-trúc) · [Tính năng](#tính-năng) · [11 Tiêu chí Minh chứng (100 điểm)](#bằng-chứng-đánh-giá-100-điểm) · [Live Demo 1 Chạm](#lệnh-live-demo-1-chạm) · [Công nghệ](#tech-stack) · [Cài đặt](#cài-đặt-nhanh) · [Cổng Dịch vụ (Endpoints)](#danh-mục-cổng-dịch-vụ-cho-hội-đồng-chấm-thi) · [Xử lý sự cố](#xử-lý-sự-cố) · [Tài liệu](#tài-liệu) · [Đóng góp](#đóng-góp-và-liên-hệ) · [Giấy phép](#giấy-phép)

---

## Giới thiệu

Hàng ngàn cơ sở đào tạo, phòng lab thí nghiệm, xưởng thực hành và doanh nghiệp dịch vụ kỹ thuật hiện nay đang quản lý sự cố trang thiết bị bằng sổ tay, tin nhắn Zalo hoặc các file Excel phân mảnh:
- Khách hàng/sinh viên báo hỏng không rõ ai đang tiếp nhận, thời hạn cam kết SLA khi nào hoàn tất.
- Kỹ thuật viên nhận việc thủ công, thiếu cẩm nang kỹ thuật và không có lịch sử xử lý tương tự để đối chiếu.
- Quản lý không đo lường được tỷ lệ vi phạm SLA, năng suất kỹ thuật viên và hao phí linh kiện định kỳ.

**FixFlow** tách toàn bộ phần nghiệp vụ dùng chung thành **Lõi mở DX-OS không giao diện (Headless Open-Core)**, kết hợp cùng **bộ 4 không gian H-P-D-I** và ứng dụng đa vai trò:

| Không gian H-P-D-I | FixFlow giải quyết bài toán gì? | Công nghệ lõi Tầng 1 & Tầng 2 |
|---|---|---|
| **H — Human** | Quản lý người dùng, hồ sơ, kỹ năng chuyên môn, phân quyền định danh SSO tập trung | Keycloak 24, RBAC 4 vai trò |
| **P — Process** | Vòng đời Ticket FSM 7 trạng thái, Outbox Pattern & DLQ đảm bảo toàn vẹn giao dịch | PostgreSQL 16, n8n BPMN |
| **D — Data** | Bảng điều khiển KPI vận hành real-time, lưu trữ ảnh/biên bản S3, kiểm toán chuỗi băm | MinIO S3, Merkle Hash Chain |
| **I — Intelligence** | Phân loại sự cố tự động, AI Recommender gợi ý KTV & linh kiện, Cẩm nang KB | TF-IDF + Cosine, Ollama Hybrid |

---

## Bằng chứng đánh giá (100 điểm)

Bảng đối soát minh chứng kỹ thuật phục vụ Hội đồng giám khảo chấm thi tuyển chọn HaUI và OLP PMNM 2026:

### I. Nhóm Điều kiện tiên quyết PoF (50 Điểm)

| STT | Tiêu chí đánh giá | Điểm | Tài liệu & Minh chứng | Lệnh kiểm tra nhanh |
|:---:|---|:---:|---|---|
| **1** | Kho mã nguồn & Lịch sử Git | 5 | [Repo GitHub công khai](https://github.com/truong-newbie/PMNM_2026_DX_FSM), web viewer hoạt động, 8 nhánh GitFlow | `git branch -a` |
| **2** | Giấy phép nguồn mở OSI | 10 | [LICENSE](LICENSE) (toàn văn 202 dòng Apache-2.0), 100% tệp có header SPDX | Quét 239/239 tệp mã |
| **3** | Quản lý phiên bản / Release | 5 | [RELEASE-NOTES-v1.3.0.md](RELEASE-NOTES-v1.3.0.md), thẻ tag `v1.3.0`, `v1.2.0`, `v1.1.0` | `git tag -l` |
| **4** | Build/install from source | 10 | [docs/deployment.md](docs/deployment.md), cấu hình pre-build `.env`, Docker Compose | `docker compose up -d --build` |
| **5** | Quản lý thư viện & Provenance | 10 | [DEPENDENCIES.md](DEPENDENCIES.md) (SBOM 200 dòng, ma trận license, không commit vendor/node_modules) | `npm ls`, `pip list` |
| **6** | Tài liệu & Bug tracker | 10 | [README.md](README.md), [CHANGELOG.md](CHANGELOG.md), [CONTRIBUTING.md](CONTRIBUTING.md), GitHub Issues/PRs | `docs/demo-script.md` |

### II. Nhóm Chất lượng sản phẩm & Trình diễn (50 Điểm)

| STT | Tiêu chí đánh giá | Điểm | Giải pháp kỹ thuật DX-FSM | Lệnh Live Demo |
|:---:|---|:---:|---|---|
| **7** | Đúng kiến trúc DX-OS & H-P-D-I | 10 | Tầng 1 Headless PaaS độc lập (SSO, Gateway, DB, Workflow); chứng minh chuỗi giá trị H-P-D-I | `make demo-core` |
| **8** | Mức độ hoàn thiện & ổn định | 10 | 77+ tickets thực tế HaUI (Migration 006), AI Circuit Breaker tự ngắt fallback < 2ms | `make demo-ai`<br>`make demo-sample-data` |
| **9** | Tính thân thiện & Giá trị thực tế | 10 | Giải quyết bài toán bảo trì cơ sở vật chất phòng lab/xưởng HaUI; phân quyền 4 vai; VI/EN | Mở `http://localhost/` |
| **10** | Chất lượng kỹ thuật & Mở rộng | 10 | Transactional Outbox + DLQ, Zero hardcoded secrets, 332 tests tự động passed 100% | `make test` |
| **11** | Trình diễn & Tiềm năng cộng đồng | 10 | Kịch bản 10 phút demo ([docs/demo-script.md](docs/demo-script.md)), 12 slides ([docs/slides.md](docs/slides.md)), AI Recommender & KB | `make demo-recommender`<br>`make demo-kb` |

---

### Lệnh Live Demo 1 Chạm

Mỗi tính năng cốt lõi của đề thi đều có thể kiểm chứng ngay bằng **một lệnh Make** (in kết quả kiểm chứng kèm dấu `✓` trực quan):

```bash
make demo-core         # [Demo 1] Khởi chạy riêng Tầng 1 Open-Core (chứng minh Lõi độc lập với App)
make demo-ai           # [Demo 2] Test AI Classifier & Circuit Breaker tự ngắt (fallback NLP < 2ms)
make demo-recommender  # [Demo 3] Test AI Recommender gợi ý KTV bằng dữ liệu thật (8 UUIDs CSDL)
make demo-kb           # [Demo 4] Test Tra cứu Cẩm nang Kỹ thuật Knowledge Base (TF-IDF tức thì)
make demo-sample-data  # [Demo 5] Thống kê 77+ tickets dữ liệu mẫu thực tế tại các tòa nhà HaUI
make demo-pii          # [Demo 6] Che giấu thông tin cá nhân PII (CCCD, SĐT, Email - NĐ 13/2023/NĐ-CP)
make demo-contrast     # [Demo 7] Kiểm thử tương phản màu sắc đạt chuẩn WCAG 2.2 AA (>= 4.5:1)
make demo-it-ot        # [Demo 8] Hội tụ IT/OT: Cảm biến IoT quá nhiệt -> Tự sinh Ticket khẩn cấp
make demo-nong-lanh    # [Demo 9] Vòng đời Nóng - Lạnh: Đóng gói vé nén WORM & truy vấn kho lạnh MinIO
make demo-audit        # [Demo 10] Quản trị Dữ liệu & Kiểm toán: Chuỗi băm SHA-256 phát hiện can thiệp
make demo-resilience   # [Demo 11] Chịu lỗi Zero-Trust: Tự động phục hồi khi MinIO S3 gặp sự cố
```

---

## Kiến trúc

![Sơ đồ Kiến trúc DX-FSM](docs/architecture-diagram.svg)

> 💡 **Bản tương tác & Tải ảnh 4K:** Mở file [docs/architecture-diagram.html](docs/architecture-diagram.html) trên trình duyệt để tải ảnh PNG siêu nét phục vụ slide thuyết trình và báo cáo.

```
┌─────────────────────────────────────────────────────────────┐
│                   TẦNG 3: ỨNG DỤNG NGHIỆP VỤ                │
│  Customer App │ KTV Mobile │ Manager Dashboard              │
│                    (React 18 SPA)                           │
├─────────────────────────────┬───────────────────────────────┤
│        TẦNG 2: H-P-D-I      │                               │
│  H: User/Profile            │ P: Ticket Workflow            │
│  D: Dashboard/KPI           │ I: AI Classify/Recommend      │
├─────────────────────────────┴───────────────────────────────┤
│                    TẦNG 1: DX-OS OPEN-CORE (HEADLESS)       │
│  Keycloak (SSO) │ nginx (Gateway) │ PostgreSQL (DB)         │
│  MinIO (S3 Files)        │ n8n (Workflow) │ Ollama (AI)     │
└─────────────────────────────────────────────────────────────┘
```

Xem chi tiết: [docs/architecture.md](docs/architecture.md)

---

## Tính năng

### 1. Quản lý Vòng đời Dịch vụ Thực địa (FSM Lifecycle)

Quy trình quản lý sự cố và bảo trì thiết bị trải qua trọn vẹn **7 trạng thái chuẩn FSM: Tiếp nhận → Phân công → Đang xử lý → Chờ linh kiện → Đã xử lý → Nghiệm thu đóng vé (hoặc Hủy vé)**:

| Vấn đề thực tế tại cơ sở | FixFlow xử lý bằng giải pháp | Không gian | Minh chứng kiểm chứng |
|---|---|---|---|
| Sự cố thất lạc, báo qua Zalo không ai nhận | Ticket FSM 7 trạng thái, hộp việc theo vai trò, thông báo tức thời | [P] Process | `make demo-sample-data` |
| Vi phạm cam kết SLA mà quản lý không hay biết | SLA Monitor quét nền 60s, tự động tính hạn chót theo mức ưu tiên, cảnh báo trễ hạn | [P] Process | `docs/muc-hoan-thien.md` |
| Phân công sai người, KTV lệch chuyên môn | AI Recommender ma trận 4 tiêu chí (Chuyên môn, Khối lượng việc, Đánh giá, Vị trí) | [I] Intelligence | `make demo-recommender` |
| Thiếu tài liệu hướng dẫn sửa chữa thiết bị | Cẩm nang kỹ thuật Knowledge Base (TF-IDF 5 chiều + Cosine), gợi ý ngay khi tạo vé | [I] Intelligence | `make demo-kb` |
| Rò rỉ thông tin cá nhân khách hàng/sinh viên | PII Masking che tự động CCCD, SĐT, Email theo NĐ 13/2023/NĐ-CP trước khi qua AI và log | [H] Human | `make demo-pii` |
| Chối bỏ trách nhiệm, can thiệp sửa lén lịch sử | Sổ kiểm toán chuỗi băm Merkle SHA-256 bất biến, nút bấm xác thực toàn vẹn 1 chạm | [D] Data | `make demo-audit` |
| Rủi ro mất mát dữ liệu khi hệ thống gặp sự cố | Transactional Outbox + DLQ, MinIO S3 đính kèm cơ chế Local Volume Fallback | [D] Data | `make demo-resilience` |

### 2. Trợ lý Trí tuệ Nhân tạo & Tự động hóa Vận hành

Hệ thống AI chạy cục bộ tại chỗ (On-Premise), bảo toàn dữ liệu nội bộ với cơ chế chuyển tiếp linh hoạt giữa Machine Learning, NLP và LLM:

| Tác tử / Dịch vụ AI | Cơ chế hoạt động & Thuật toán | Hiệu năng & Đặc tính nổi bật | Minh chứng |
|---|---|---|---|
| **Phân loại sự cố (Classifier)** | Kết hợp Hybrid: Regex từ khóa trọng số chuyên ngành + TF-IDF Vectorizer + Ollama LLM | Tốc độ xử lý < 2ms, Circuit Breaker tự ngắt fallback sang Regex khi LLM bận | `make demo-ai` |
| **Gợi ý KTV & Linh kiện (Recommender)** | Chấm điểm đa tiêu chí: Khớp chuyên môn (40%), Khối lượng việc (30%), Đánh giá sao (20%), Khoảng cách (10%) | Khớp 100% dữ liệu thực tế (8 UUIDs kỹ thuật viên thật trong CSDL) | `make demo-recommender` |
| **Cẩm nang Kỹ thuật (Knowledge Base)** | Vector TF-IDF 5 chiều, trích xuất đặc trưng từ khóa và tính độ tương đồng Cosine | Thời gian phản hồi < 1ms, trích đoạn bài viết và liên kết tài liệu gốc | `make demo-kb` |
| **Bảo vệ PII & Kiểm toán Dữ liệu** | Regex nhận diện CCCD (12 số), SĐT VN (10 số), Email; Băm chuỗi Merkle SHA-256 | Tuân thủ tuyệt đối Nghị định 13/2023/NĐ-CP và nguyên lý không thể chối bỏ (iii) | `make demo-pii` |

---

## Tech Stack

| Thành phần | Công nghệ | Giấy phép |
|---|---|---|
| Identity/SSO | Keycloak 24 | Apache-2.0 |
| API Gateway | nginx | BSD-2-Clause |
| Database | PostgreSQL 16 | PostgreSQL |
| File Storage | MinIO Object Storage (S3 API) | AGPL-3.0 |
| Workflow | n8n | Elastic-2.0 / Sustainable |
| Backend API | FastAPI (Python 3.11) | MIT |
| AI Service | Hybrid (Rule-based Regex + TF-IDF + Heuristic + Ollama) | Apache-2.0 / MIT |
| Frontend | React 18 + Vite + TypeScript | MIT |
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
git clone https://github.com/truong-newbie/PMNM_2026_DX_FSM.git
cd PMNM_2026_DX_FSM

# 2. Build và chạy toàn bộ
docker compose up -d --build

# 3. Đợi services khởi động (~2-3 phút)
docker compose ps

# 4. Truy cập các service
# Frontend Web App:        http://localhost/ (hoặc http://localhost:3000)
# Cổng Giám sát & Tracing: http://localhost/monitor
# Cổng Tài liệu API Docs:  http://localhost/docs
# Keycloak SSO Console:    http://localhost:8080/realms/dx-fsm
# n8n Workflow Engine:     http://localhost:5678
```

### Danh mục Cổng Dịch vụ (cho Hội đồng Chấm thi)

| Cổng Dịch vụ | Địa chỉ truy cập | Tài khoản / Xác thực | Vai trò & Mục đích |
|---|---|---|---|
| **FixFlow Web Portal** | `http://localhost/` (hoặc `:3000`) | SSO (4 tài khoản bên dưới) | Ứng dụng FSM chính cho Quản lý, KTV, Khách hàng |
| **Bảng Giám sát & Truy vết** | `http://localhost/monitor` | Public / DevOps | Giám sát 7 microservices, Merkle Hash Chain, Outbox DLQ |
| **Cổng Tài liệu API Swagger** | `http://localhost/docs` | Public / Bearer Token | Hợp nhất 47 endpoints OAS 3.1 + Server Selector |
| **Đặc tả Kỹ thuật ReDoc** | `http://localhost/redoc` | Public | Định dạng ReDoc phục vụ tích hợp kỹ thuật |
| **OpenAPI 3.1 Schema** | `http://localhost/api/v1/openapi.json` | Public JSON | JSON schema cho SDK & mở rộng ứng dụng |
| **Keycloak SSO Console** | `http://localhost:8080` | `admin` / `admin123` | Quản trị Identity, RBAC, Realm `dx-fsm` |
| **MinIO Storage S3** | `http://localhost:9001` | `minioadmin` / `minioadmin` | Kho lưu trữ đối tượng (S3 API) chứa ảnh đính kèm |
| **n8n Workflow Automation** | `http://localhost:5678` | Không cần mật khẩu | Tự động hóa luồng quy trình nghiệp vụ BPMN |

### Build từ source

```bash
# Backend (FastAPI)
cd services/ticket-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001

# Frontend (React 18)
cd app
npm install
npm run build
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
| Manager | `manager@haui.vn` | `manager123` | Dashboard, phân công kỹ thuật viên |
| Admin | `admin@haui.vn` | `admin123` | Quản trị Keycloak |

---

## Cấu trúc dự án

```
dx-fsm/
├── core/                    # Tầng 1: Open-Core (Headless)
│   ├── keycloak/            # SSO + RBAC
│   ├── nginx/               # API Gateway
│   ├── postgres/            # Database schema & migrations
│   ├── minio/               # S3 Object storage (active)
│   └── n8n/                 # Workflow engine
├── services/                # Tầng 2: Microservices
│   ├── ticket-service/      # Core API (FastAPI)
│   ├── ai-service/          # AI/ML (FastAPI + TF-IDF + Ollama)
│   └── notification-service/# Notifications
├── app/                     # Tầng 3: React 18 Frontend
├── docs/                    # Tài liệu kỹ thuật & Báo cáo
├── scripts/                 # Utility scripts & CI verification
└── docker-compose.yml       # Orchestration
```

---

## Xử lý sự cố

| Hiện tượng | Nguyên nhân và cách xử lý |
|---|---|
| Chạy `docker compose up` báo lỗi cổng 80 hoặc 8080 đã được sử dụng | Cổng 80 (Gateway) hoặc 8080 (Keycloak) bị ứng dụng khác chiếm dụng (IIS, Apache, Skype...). Đổi cổng trong `.env` hoặc tắt tiến trình đang chiếm cổng: `netstat -ano \| findstr :80` |
| `docker compose build` kéo image lâu hoặc gặp lỗi mạng | Docker Hub hạn chế lượt kéo ẩn danh. Cấu hình DNS `8.8.8.8` hoặc bổ sung mirror `mirror.gcr.io` vào cấu hình Docker Daemon |
| Không kết nối được Keycloak khi mở qua mạng LAN hoặc IP | Trình duyệt chặn Web Crypto API (đăng nhập PKCE SHA-256) trên HTTP thường qua IP mạng LAN. Chỉ truy cập qua `http://localhost` hoặc qua đường hầm HTTPS: `https://<tunnel-domain>` |
| Phiên làm việc hết hạn hoặc lỗi đăng nhập SSO | Token Keycloak tự làm mới ngầm. Nếu phiên làm việc quá hạn, bấm vào Avatar tài khoản ở góc trên bên phải → chọn Đăng xuất rồi đăng nhập lại |
| Dịch vụ AI phản hồi chậm khi máy chủ không có GPU | Hệ thống tích hợp sẵn Circuit Breaker: nếu Ollama chưa sẵn sàng, AI Service tự động chuyển sang chế độ Rule-based NLP (< 2ms) mà không làm gián đoạn người dùng |

Chưa gỡ được sự cố? Mở issue theo [mẫu báo lỗi](https://github.com/truong-newbie/PMNM_2026_DX_FSM/issues/new?template=bug_report.md) kèm kết quả `docker compose ps` và nhật ký `docker compose logs <tên_service>`.

---

## Tài liệu

| Nhóm | Tài liệu |
|---|---|
| **Vận hành & Hướng dẫn** | [Kịch bản Live Demo 10 phút](docs/demo-script.md) · [Hướng dẫn triển khai Docker & Tunnel](docs/deployment.md) · [Cổng Tài liệu API Swagger](http://localhost/docs) · [Hướng dẫn người dùng](docs/user-guide.md) |
| **Kiến trúc & Kỹ thuật** | [Kiến trúc DX-OS 3 tầng & H-P-D-I](docs/architecture.md) · [Đặc tả kỹ thuật API RESTful](docs/api-specification.md) · [Báo cáo kỹ thuật tổng thể](docs/technical-report.md) · [Kế hoạch phát hành AI Production](docs/ai-production-plan.md) |
| **Dự thi & Đánh giá (OLP)** | [Báo cáo đối soát 100 điểm & Minh chứng](docs/muc-hoan-thien.md) · [Hỏi đáp & Phản biện Hội đồng Giám khảo](docs/council-qa.md) · [Thẩm định Bản quyền OSI](docs/licenses-audit.md) · [Slide thuyết trình 12 trang](docs/slides.md) · [Tiêu chí cuộc thi 2026](docs/danh-gia-tieu-chi-cuoc-thi-2026.md) |
| **Dự án & Quản trị** | [Bản quyền & Phụ thuộc SBOM](DEPENDENCIES.md) · [Lịch sử thay đổi CHANGELOG](CHANGELOG.md) · [Quy tắc đóng góp CONTRIBUTING](CONTRIBUTING.md) · [Chính sách an toàn SECURITY](docs/SECURITY.md) · [Giấy phép Apache-2.0](LICENSE) |

---

## Đóng góp và liên hệ

- **Báo lỗi, đề xuất tính năng:** mở issue theo [mẫu báo lỗi](https://github.com/truong-newbie/PMNM_2026_DX_FSM/issues/new?template=bug_report.md) hoặc [mẫu đề xuất](https://github.com/truong-newbie/PMNM_2026_DX_FSM/issues/new?template=feature_request.md); xem [mọi issue](https://github.com/truong-newbie/PMNM_2026_DX_FSM/issues).
- **Lịch sử thay đổi:** [`CHANGELOG.md`](CHANGELOG.md) theo chuẩn Keep a Changelog; các bản phát hành ở [Releases](https://github.com/truong-newbie/PMNM_2026_DX_FSM/releases).
- **Đóng góp mã nguồn:** đọc [`CONTRIBUTING.md`](CONTRIBUTING.md) trước khi mở pull request; tuân theo quy chuẩn GitFlow và quy tắc ứng xử nguồn mở.
- **Lỗ hổng bảo mật:** không mở issue công khai — báo cáo riêng tư theo chính sách an toàn thông tin tại [`docs/SECURITY.md`](docs/SECURITY.md).

| Thành viên | GitHub | Email |
|---|---|---|
| Đỗ Đăng Trường | [truong-newbie](https://github.com/truong-newbie) | <dangtruong3122005@gmail.com> |
| Nguyễn Văn Huy | [NguyenVanHuy205](https://github.com/NguyenVanHuy205) | <nguyenvanhuy12072005@gmail.com> |
| Phan Đại Cương | [PhanDaiCuong](https://github.com/PhanDaiCuong) | <phancuongtmtlhp@gmail.com> |

---

## Giấy phép

Phát hành theo **Apache License 2.0** — một giấy phép mã nguồn mở được OSI phê duyệt. Toàn văn giấy phép: [`LICENSE`](LICENSE).

Mọi tệp mã nguồn đều có thông tin bản quyền và giấy phép theo chuẩn SPDX: tệp mã mang header `// SPDX-License-Identifier: Apache-2.0` hoặc `# SPDX-License-Identifier: Apache-2.0`. Danh mục kiểm toán bản quyền 100% tệp trong kho lưu trữ xem tại [`docs/licenses-audit.md`](docs/licenses-audit.md).

FixFlow **điều phối** các phần mềm nguồn mở thượng nguồn ở dạng nguyên bản (official container images), không sao chép và không chỉnh sửa mã nguồn của chúng vào kho này. Toàn bộ danh mục phụ thuộc và xuất xứ mã nguồn (SBOM) được công khai minh bạch tại [`DEPENDENCIES.md`](DEPENDENCIES.md).

---

**Đội thi HaUI — OLP Tin học Sinh viên PMNM 2026 — Đại học Công nghiệp Hà Nội**
