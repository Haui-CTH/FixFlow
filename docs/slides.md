<!-- SPDX-License-Identifier: Apache-2.0 -->
# Dàn ý Slide Thuyết trình DX-FSM (12 Slides Chuẩn Barem OLP 2026)
### Đề tài: Nền tảng Quản lý Dịch vụ Hiện trường trên nền tảng DX-OS Open-Core
**Cuộc thi Phần mềm Nguồn mở HaUI 2026 (VFOSSA)**

---

### Slide 1: Trang tiêu đề & Thông tin Dự án (Title & Team)
* **Tiêu đề chính**: DX-FSM — Digital Transformation Field Service Management
* **Phụ đề**: Nền tảng Quản lý Dịch vụ Kỹ thuật Hiện trường chuẩn kiến trúc DX-OS Open-Core
* **Đơn vị dự thi**: Đại học Công nghiệp Hà Nội (HaUI) — Cuộc thi PMNM 2026
* **Tác giả / Nhóm phát triển**: Nhóm tác giả DX-FSM
* **Giấy phép bản quyền**: Apache License 2.0 (100% mã nguồn mở chuẩn OSI)
* **Tài liệu & Sơ đồ kiến trúc**: [`docs/architecture-diagram.svg`](architecture-diagram.svg) | [`INSTALL.md`](../INSTALL.md)

---

### Slide 2: Đặt vấn đề & Nhu cầu Thực tế (Problem Statement)
* **Thực trạng**: Các nhà máy, xí nghiệp quản lý sự cố kỹ thuật qua Zalo, Excel, điện thoại rời rạc $\rightarrow$ Trễ hạn, mất mát thông tin, vi phạm SLA.
* **Mục tiêu**: Xây dựng một nền tảng quản lý hiện trường toàn diện:
  1. Chuẩn hóa quy trình tiếp nhận $\rightarrow$ điều phối $\rightarrow$ xử lý $\rightarrow$ nghiệm thu.
  2. Ứng dụng AI thông minh nhưng phải chịu lỗi cao, hoạt động ngoại tuyến tốt.
  3. Tuân thủ tuyệt đối chuẩn kiến trúc nguồn mở **DX-OS Open-Core**.

---

### Slide 3: Triết lý Kiến trúc DX-OS Open-Core 3 Tầng
* **Nguyên lý "Open-Core First — Application Second"**:
  * **Tầng 1 (Open-Core PaaS)**: Keycloak, Nginx Gateway, PostgreSQL, MinIO, n8n. Hoàn toàn Headless và độc lập với nghiệp vụ FSM (Sẵn sàng tái sử dụng cho bất kỳ bài toán quản lý nào khác).
  * **Tầng 2 (Không gian phân rã H-P-D-I)**:
    - **H (Human)**: Quản lý người dùng, kỹ thuật viên, phân quyền RBAC đa vai trò.
    - **P (Process)**: Máy trạng thái ticket, SLA monitor worker, Outbox events.
    - **D (Data)**: Chỉ số KPI, gauge SLA thời gian thực, báo cáo tổng hợp.
    - **I (Intelligence)**: Phân loại sự cố NLP, TF-IDF Knowledge Base, Gợi ý KTV.
  * **Tầng 3 (Ứng dụng Người dùng cuối)**: React 18 SPA Responsive, hỗ trợ đa ngôn ngữ (VI/EN), tối ưu thao tác hiện trường.
* **Sơ đồ kiến trúc hệ thống**: Chiếu trực tiếp vector SVG chuẩn màu Signet Pastel tại [`docs/architecture-diagram.svg`](architecture-diagram.svg).

---

### Slide 4: Hạ tầng Nền tảng Tầng 1 (Open-Core PaaS)
* **Keycloak 24**: Quản trị danh tính tập trung (IAM), Single Sign-On (SSO), xác thực JWT qua JWKS endpoint (Zero-Secret trong mã nguồn).
* **Nginx API Gateway**: Điểm tiếp nhận duy nhất tại Port 80, SSL/TLS termination, reverse proxy định tuyến tới các microservices nội bộ.
* **PostgreSQL 16**: Cơ sở dữ liệu quan hệ ACID, hỗ trợ cơ chế migration tự động.
* **MinIO Object Storage**: Lưu trữ an toàn hình ảnh hiện trường, tệp đính kèm sự cố tương thích chuẩn S3 API.
* **n8n Workflow Automation**: Tự động hóa quy trình nghiệp vụ (Webhook leo thang sự cố, gửi thông báo Email/SMS đa kênh).

---

### Slide 5: Quy trình Nghiệp vụ FSM, Máy Trạng thái & Dữ liệu Mẫu 120 Tickets
* **Máy trạng thái 7 bước chuẩn công nghiệp**:
  $$\text{new} \rightarrow \text{assigned} \rightarrow \text{in\_progress} \rightarrow \text{pending} \rightarrow \text{resolved} \rightarrow \text{closed} \quad (\text{hoặc } \text{cancelled})$$
* **Giám sát Cam kết Dịch vụ (SLA Engine)**:
  - Tự động tính hạn phản hồi và hạn xử lý theo độ ưu tiên (`critical`: 4h, `high`: 8h, `medium`: 24h, `low`: 48h).
  - Background worker liên tục rà soát trạng thái: `healthy`, `at_risk`, `breached`.
  - Hiển thị trực quan qua đồng hồ SLA Gauge trên Dashboard.
* **Bộ dữ liệu mẫu thực tế chuẩn Doanh nghiệp (Migration 006)**:
  - Tích hợp sẵn **120 tickets thực tế** phân bổ đều 7 danh mục sự cố kỹ thuật.
  - Đầy đủ hội thoại bình luận 2 chiều (`ticket_comments`), ghi chú mật (`ticket_notes`), lịch sử kiểm toán (`ticket_history`).

---

### Slide 6: Độ tin cậy Dữ liệu với Transactional Outbox Pattern
* **Vấn đề Dual-Write**: Nguy cơ dữ liệu đã lưu vào DB nhưng gọi notification/n8n thất bại do sự cố mạng.
* **Giải pháp Transactional Outbox Pattern**:
  - Ghi nhận bản ghi sự kiện vào bảng `outbox_events` trong **cùng transaction ACID** của PostgreSQL.
  - Worker nền quét định kỳ mỗi 30s đẩy sự kiện tới Notification Service / n8n webhook.
  - Cơ chế **Exponential Backoff** và **Circuit Breaker** (tự động chuyển vào Dead Letter Queue sau 5 lần retry thất bại).

---

### Slide 7: Phân hệ AI Thiết thực: Hybrid Classifier & Circuit Breaker (A5.1)
* **Kiến trúc 3 Tầng chịu lỗi cao (Resilient Architecture)**:
  1. **Tier 1 (LRU Cache)**: Hash SHA-256 theo tiêu đề + mô tả, phản hồi tức thì < 1ms.
  2. **Tier 2 (Ollama LLM)**: Zero-shot prompt xuất JSON qua mô hình nguồn mở nhẹ (`llama3.2:3b` / `qwen2.5`).
  3. **Tier 3 (Rule-based Regex Fallback)**: Bộ từ khóa trọng số chuyên ngành tiếng Việt & Anh, phản hồi < 2ms, **hoạt động 100% trên CPU thường với 0 MB VRAM**.
* **Circuit Breaker Tự ngắt**: Tự động phát hiện Ollama offline hoặc timeout sau 2s, chuyển mạch tức thì sang Tier 3 mà không gián đoạn người dùng.

---

### Slide 8: Cẩm nang Kỹ thuật: Semantic Knowledge Base (A5.2)
* **Thuật toán cốt lõi**: TF-IDF + Cosine Similarity thuần Python (chạy trực tiếp trên CPU, không phụ thuộc dịch vụ ngoài).
* **Tối ưu hóa tiếng Việt**: Trọng số tiêu đề $\times 3$, tiền xử lý ngôn ngữ tự nhiên, bảo đảm an toàn đa luồng bằng `RLock`.
* **Trải nghiệm hỗ trợ hiện trường**:
  - Tự động gợi ý cẩm nang giải pháp ngay khi gõ mô tả sự cố (debounced 300ms).
  - Xem trước quy trình xử lý và cung cấp nút **"Chèn vào mô tả"** chỉ với 1 click.

---

### Slide 9: Điều phối Thông minh: Đề xuất Kỹ thuật viên Đa tiêu chí (A5.3)
* **Mô hình Chấm điểm Đa tiêu chí (Multi-factor Scoring)**:
  - **40% Khớp chuyên môn kỹ thuật**: Ánh xạ 7 danh mục sự cố với tay nghề KTV.
  - **30% Tải công việc hiện tại**: Ưu tiên KTV đang có ít ticket `in_progress` để cân bằng tải.
  - **30% Đánh giá & Hiệu suất**: Dựa trên số sao đánh giá thực tế và lịch sử xử lý.
* **Gắn kết Dữ liệu Thật 100%**: Ánh xạ với 8 UUID KTV thật trong database PostgreSQL, hiển thị huy hiệu `★ Phù hợp nhất (XX%)` kèm lý do minh bạch trên Modal phân công.

---

### Slide 10: An toàn Thông tin & Quản trị Bí mật (Security & IAM)
* **Chính sách An toàn Secret-Zero**:
  - 100% không hardcode mật khẩu, khóa bí mật hay token trong mã nguồn. Toàn bộ cấu hình qua biến môi trường `.env`.
  - Bộ kiểm soát Pre-commit tự động (`scripts/check-secrets.cjs`) quét và ngăn chặn rò rỉ credential trước khi commit.
* **Kiểm soát Truy cập Dựa trên Vai trò (RBAC)**:
  - 4 vai trò chuẩn: `customer` (khách hàng), `technician` (kỹ thuật viên), `manager` (điều phối viên), `admin` (quản trị hệ thống).
  - Bảo vệ 2 lớp: Client-side Guard (`RoleGuard`) và Server-side JWT Claims verification.

---

### Slide 11: Kiểm thử Toàn diện & Tuân thủ Nguồn mở (Quality & Open Source)
* **Kiểm thử Tự động Toàn diện (Tiêu chí 7-11)**:
  - Frontend: **324 tests / 42 test suites PASSED 100%** (Vitest + React Testing Library).
  - Backend: Kiểm thử đầy đủ máy trạng thái, Outbox worker và thuật toán gợi ý (Pytest).
* **Tuân thủ Bản quyền & Bằng chứng 100 điểm**:
  - **Tiêu chí 2 (10đ)**: 100% tệp mã nguồn gắn nhãn bản quyền `SPDX-License-Identifier: Apache-2.0`.
  - **Tiêu chí 4 (10đ)**: Hướng dẫn cài đặt độc lập chuẩn ([`INSTALL.md`](../INSTALL.md)) qua Docker Compose và Native Build.
  - **Tiêu chí 5 (10đ)**: Quản lý phụ thuộc và SBOM minh bạch ([`DEPENDENCIES.md`](../DEPENDENCIES.md)).

---

### Slide 12: Tổng kết, Kịch bản Demo 3 Luồng & Trả lời Chất vấn (Q&A)
* **3 Giá trị Cốt lõi của DX-FSM**:
  1. **Chuẩn mực Open-Core**: Tầng 1 PaaS độc lập, tái sử dụng tối đa cho các bài toán quản lý khác.
  2. **Trí tuệ Nhân tạo Thiết thực**: Chịu lỗi cao, chạy CPU nhẹ nhàng, không phụ thuộc hạ tầng đắt đỏ.
  3. **Vận hành Hiện trường Toàn diện**: Quy trình khép kín, minh bạch từ tiếp nhận đến nghiệm thu.
* **Kịch bản Demo Sẵn sàng (10 Phút)**:
  - **Luồng 1 (Khách hàng)**: Báo sự cố kỹ thuật $\rightarrow$ AI phân loại & gợi ý cẩm nang tức thì.
  - **Luồng 2 (Điều phối viên)**: Giám sát Dashboard SLA $\rightarrow$ Phân công KTV với gợi ý `★ Phù hợp nhất`.
  - **Luồng 3 (Kỹ thuật viên)**: Nhận việc trên di động $\rightarrow$ Cập nhật tiến độ $\rightarrow$ Hoàn thành nghiệm thu.
  - Tự động hóa kiểm tra qua các lệnh: `make demo-health`, `make demo-ai`, `make demo-sla`.
* **Trân trọng cảm ơn Hội đồng Giám khảo!** Nhóm DX-FSM sẵn sàng trả lời chất vấn.
