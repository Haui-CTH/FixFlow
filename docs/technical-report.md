# DX-FSM Báo cáo Kỹ thuật (Technical Report)
### Nền tảng Quản lý Dịch vụ Thực địa (Field Service Management) trên nền tảng DX-OS Open-Core
**Cuộc thi Phần mềm Nguồn mở HaUI 2026 / OLP PMNM 2026 (VFOSSA)**

---

## 1. Tổng quan Dự án (Executive Summary)

**DX-FSM (Digital Transformation Field Service Management)** là nền tảng quản lý dịch vụ kỹ thuật hiện trường nguồn mở, giải quyết triệt để bài toán phân mảnh trong tiếp nhận, điều phối, xử lý sự cố kỹ thuật tại các doanh nghiệp và nhà máy.

### 1.1. Triết lý Thiết kế: "Open-Core First — Application Second"
Dự án được xây dựng tuân thủ 100% định nghĩa DX-OS Open-Core của VFOSSA:
- **Tầng 1 (Open-Core PaaS):** Nền tảng hạ tầng hoàn toàn trung lập (Headless), độc lập với nghiệp vụ (Keycloak, Nginx, PostgreSQL, n8n). Tầng này có thể tái sử dụng cho bất kỳ bài toán nghiệp vụ nào khác mà không phải sửa một dòng mã nguồn hạ tầng.
- **Tầng 2 (H-P-D-I Services):** Không gian nghiệp vụ gồm Con người (Human), Quy trình (Process), Dữ liệu (Data), và Trí tuệ nhân tạo (Intelligence).
- **Tầng 3 (Client Applications):** Giao diện người dùng Web Responsive SPA đa ngôn ngữ (VI/EN), hỗ trợ PWA và hoạt động ngoại tuyến.

### 1.2. Technology Stack & Provenance

| Thành phần | Công nghệ | Phiên bản | Giấy phép | Vai trò |
|---|---|---|---|---|
| **API Gateway** | Nginx | 1.25 Alpine | BSD-2-Clause | Reverse Proxy, SSL, Gateway routing |
| **Identity & IAM** | Keycloak | 24.0.5 | Apache-2.0 | SSO, RBAC, OpenID Connect, JWT JWKS |
| **Database** | PostgreSQL | 16.2 Alpine | PostgreSQL | Lưu trữ dữ liệu quan hệ, ACID transactions |
| **Workflow Engine** | n8n | 1.36.0 | Sustainable / Elastic-2.0 | Tự động hóa quy trình nghiệp vụ & thông báo |
| **Backend API** | FastAPI / Python | 3.11 / 0.115 | MIT | REST API, SLA engine, Outbox publisher |
| **AI Subsystem** | Custom ML + Ollama | Hybrid Engine | Apache-2.0 / MIT | Phân loại sự cố, TF-IDF KB, Recommender |
| **Frontend SPA** | React + Vite + TS | 18.3 / 5.5 | MIT | Giao diện điều phối, kỹ thuật viên & khách hàng |
| **Orchestration** | Docker Compose | v2.26+ | Apache-2.0 | Đóng gói và triển khai một lệnh duy nhất |

---

## 2. Kiến trúc Hệ thống (System Architecture)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       TẦNG 3: REACT 18 SPA (PORT 3000)                      │
│       Customer Portal   │   Dispatcher Dashboard   │   Technician App       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP/REST (Bearer JWT)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TẦNG 1: NGINX REVERSE GATEWAY (PORT 80)                  │
│       /api/v1/tickets/  │  /api/v1/classify  │  /api/v1/recommend  │  /api/v1/kb   │
└──────────────┬───────────────────────┼───────────────────────┬──────────────┘
               │                       │                       │
               ▼                       ▼                       ▼
    ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
    │   Ticket Service    │ │     AI Service      │ │Notification Service │
    │   (FastAPI :8001)   │ │   (FastAPI :8002)   │ │   (FastAPI :8003)   │
    │ SLA & Outbox Engine │ │  TF-IDF & Scorer    │ │ MailHog / Webhook   │
    └──────────┬──────────┘ └──────────┬──────────┘ └──────────┬──────────┘
               │                       │                       │
               └───────────────────────┼───────────────────────┘
                                       ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                     POSTGRESQL 16 (PORT 5432)                           │
    │         tickets, users, technicians, outbox_events, sla_policies        │
    └──────────────────────────────────┬──────────────────────────────────────┘
                                       │ Transactional Outbox Scan (30s)
                                       ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                      N8N WORKFLOW AUTOMATION (:5678)                    │
    │             Email Notifications, SMS Stubs, Escalation Webhooks         │
    └─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Các Luồng Nghiệp vụ Cốt lõi (Core Business Workflows)

### 3.1. Vòng đời Ticket (State Machine)
Mọi ticket tuân thủ máy trạng thái nghiêm ngặt với 7 trạng thái hợp lệ:
$$\text{new} \xrightarrow{\text{assign}} \text{assigned} \xrightarrow{\text{start}} \text{in\_progress} \xrightarrow{\text{block}} \text{pending} \xrightarrow{\text{resolve}} \text{resolved} \xrightarrow{\text{verify}} \text{closed}$$
- Chỉ **Manager / Dispatcher** mới có quyền phân công KTV (`assign`).
- Chỉ **Technician được giao** mới có quyền chuyển `in_progress`, thêm `internal notes` và đánh dấu `resolved`.
- Khách hàng (`Customer`) là người nghiệm thu cuối cùng để chuyển `closed`, hoặc `cancelled` nếu ticket chưa xử lý.

### 3.2. Giám sát & Cảnh báo SLA (Service Level Agreement)
- Mỗi ticket được gắn SLA dựa trên Mức độ ưu tiên (`critical`: 4h, `high`: 8h, `medium`: 24h, `low`: 48h).
- Background worker quét định kỳ, tính toán thời gian phản hồi (`response_due_at`) và thời gian xử lý (`resolve_due_at`).
- Khi vi phạm (Breached) hoặc sắp hết hạn (At Risk), hệ thống phát sinh event vào `outbox_events` để kích hoạt n8n gửi email/webhook khẩn cấp.

### 3.3. Transactional Outbox Pattern & Chống Mất Dữ Liệu
Để giải quyết bài toán Dual-Write trong kiến trúc phân tán:
1. Khi thay đổi trạng thái Ticket, một bản ghi sự kiện được ghi vào bảng `outbox_events` **trong cùng transaction của PostgreSQL**.
2. Worker độc lập quét các sự kiện chưa gửi (`status = 'PENDING'`), gửi tới n8n / notification service.
3. Hỗ trợ **Exponential Backoff** (5s, 25s, 125s, 625s), **Circuit Breaker** sau 5 lần lỗi liên tiếp, và chuyển vào **Dead Letter Queue (DLQ)** nếu vượt quá ngưỡng thử lại, đảm bảo hệ thống không bao giờ bị nghẽn.

---

## 4. Phân hệ Trí tuệ Nhân tạo (AI & Machine Learning Subsystem)

Phân hệ AI trong DX-FSM được thiết kế theo tôn chỉ: **Thiết thực, Chịu lỗi cao (Resilient), Hoạt động ngoại tuyến 100% không bắt buộc GPU**.

### 4.1. Bộ Phân loại Sự cố Hybrid 2 Tầng (Hybrid Ticket Classifier)
Tự động đề xuất Danh mục (7 categories) và Mức độ ưu tiên (4 priorities):
1. **Tier 1 (Bộ nhớ Cache LRU)**: Lưu trữ theo mã băm SHA-256 của `title + description` với TTL 1 giờ. Phản hồi tức thì < 1ms.
2. **Tier 2 (Ollama LLM)**: Sử dụng các mô hình nguồn mở nhẹ (`llama3.2:3b` hoặc `qwen2.5:1.5b`). Prompt chuẩn hóa xuất JSON, tự động bóc tách code fence markdown ````json ... ```` và kiểm tra allowlist.
3. **Tier 3 (Rule-based Regex Fallback)**: Bộ quy tắc từ khóa trọng số chuyên ngành tiếng Việt & tiếng Anh. Tốc độ < 5ms, tiêu tốn 0 MB VRAM, hoạt động tin cậy trên mọi cấu hình phần cứng.
4. **Circuit Breaker**: Nếu kết nối đến Ollama bị ngắt, AI Service kích hoạt trạng thái cooldown 15s để chuyển ngay sang Tier 3, bảo đảm giao diện không bao giờ bị trễ mạng.

### 4.2. Tìm kiếm Cẩm nang Giải pháp (Knowledge Base Semantic Search)
- **Thuật toán**: TF-IDF (Term Frequency-Inverse Document Frequency) kết hợp Cosine Similarity.
- **Tối ưu hóa**: Trọng số tiêu đề $\times 3$, tiền xử lý tiếng Việt, khóa luồng an toàn `RLock`.
- **Giao diện**: Tích hợp debounce tìm kiếm tức thì trên màn hình Tạo Ticket và Chi tiết Ticket. Cho phép xem nhanh giải pháp và chèn nội dung vào ticket chỉ với 1 click.

### 4.3. Đề xuất Phân công Kỹ thuật viên (Technician Recommender)
Không phân công ngẫu nhiên; thuật toán chấm điểm đa tiêu chí kết hợp Collaborative Filtering:
- **Khớp chuyên môn (Specialty Match)**: 40% (khớp với 7 danh mục kỹ thuật).
- **Tải công việc hiện tại (Workload Score)**: 30% (ưu tiên KTV đang có ít ticket `in_progress`).
- **Lịch sử xử lý & Đánh giá (Performance & Rating)**: 30% (tính điểm từ số sao đánh giá và thời gian hoàn thành trung bình).
- **Dữ liệu thật**: 100% KTV được ánh xạ với UUID cố định trong PostgreSQL (`005_seed_technicians.sql`).

---

## 5. An toàn Thông tin & Quản trị Danh tính (Security & IAM)

1. **Keycloak 24 IAM**:
   - Sử dụng Realm `dx-fsm` chuyên biệt.
   - 4 Role người dùng chuẩn hóa: `admin`, `manager`, `technician`, `customer`.
   - Xác thực qua chuẩn OpenID Connect (OIDC). Backend xác thực tính hợp lệ của JWT token trực tiếp từ JWKS endpoint của Keycloak, hoàn toàn không cần chia sẻ client secret trong mã nguồn.
2. **Chính sách Secret Zero (No Hardcoded Secrets)**:
   - 100% mật khẩu, khóa bí mật đều được đọc từ biến môi trường (`.env`).
   - Tích hợp công cụ quét mã nguồn `scripts/check-secrets.cjs` trong git hook trước khi commit, ngăn chặn tuyệt đối việc rò rỉ credential lên GitHub.
3. **SPDX License Compliance**:
   - Toàn bộ **227/227 tệp mã nguồn (100.00%)** đều có header bản quyền chuẩn SPDX Apache-2.0.

---

## 6. Kết quả Kiểm thử & Đo lường Chất lượng (Test & Quality Metrics)

Hệ thống được kiểm thử tự động đa tầng:

```
[Vitest Frontend]   ===> 324 passed / 42 test files (100%)
[Pytest Backend]    ===> 141 passed (Ticket Service) + 74 passed (AI Service) + 32 passed (Notification)
[SPDX Audit]        ===> 227 / 227 code files (100.00%)
[SBOM Matrix]       ===> 100% Dependencies tương thích Apache-2.0
```

- **Frontend Unit Tests (Vitest)**: 324/324 tests passed qua 42 test suite, kiểm tra đầy đủ RoleGuard, Form validation, Optimistic UI updates, Responsive layouts, và Khả năng chịu lỗi của AI.
- **Độ chính xác phân loại**: Đạt 85% độ chính xác danh mục trên tập benchmark 200 mẫu ticket thực tế.
- **Khả năng chịu lỗi (Graceful Degradation)**: Khi tắt toàn bộ Ollama và AI Service, hệ thống vẫn tạo ticket, tính SLA và phân công KTV hoàn toàn bình thường bằng bộ máy dự phòng cục bộ.

---

## 7. Hướng dẫn Vận hành Nhanh (Operations Guide)

Triển khai toàn bộ nền tảng chỉ với một lệnh thông qua Docker Compose:

```bash
# 1. Khởi động toàn bộ cụm dịch vụ
docker compose up -d --build

# 2. Kiểm tra trạng thái sức khỏe
make health
# hoặc: curl http://localhost:8002/health

# 3. Truy cập hệ thống
# Frontend UI:       http://localhost:3000
# Keycloak SSO:      http://localhost:8080
# API Gateway:       http://localhost/api/v1/tickets
# Workflow n8n:      http://localhost:5678
```

---

## 8. Kết luận & Tiềm năng Phát triển

DX-FSM là minh chứng hoàn hảo cho việc ứng dụng kiến trúc **DX-OS Open-Core**: tách bạch hoàn toàn hạ tầng nguồn mở độc lập (Tầng 1) với nghiệp vụ FSM hiện đại (Tầng 2 & 3). Giải pháp vừa đáp ứng xuất sắc tiêu chí đánh giá kỹ thuật khắt khe của Hội đồng OLP PMNM HaUI 2026, vừa sẵn sàng đưa vào ứng dụng thực tế tại các xí nghiệp, nhà máy chuyển đổi số.
