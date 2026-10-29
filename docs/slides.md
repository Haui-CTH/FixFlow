<!-- SPDX-License-Identifier: Apache-2.0 -->
# Dàn ý Slide Thuyết trình FixFlow (12 Slides Chuẩn Barem OLP 2026)
### Đề tài: Nền tảng Quản lý Dịch vụ Kỹ thuật Hiện trường trên nền tảng DX-OS Open-Core
**Cuộc thi Phần mềm Nguồn mở HaUI 2026 (VFOSSA)**

---

### Slide 1: Trang tiêu đề & Thông tin Dự án (Title & Team)
* **Tiêu đề chính**: FixFlow — Digital Transformation Field Service Management (DX-FSM)
* **Phụ đề**: Nền tảng Quản lý Dịch vụ Kỹ thuật Hiện trường chuẩn kiến trúc DX-OS Open-Core
* **Đơn vị dự thi**: Đại học Công nghiệp Hà Nội (HaUI) — Cuộc thi PMNM 2026
* **Tác giả / Nhóm phát triển**: Nhóm tác giả HaUI (Đỗ Đăng Trường, Nguyễn Văn Huy, Phan Đại Cương)
* **Giấy phép bản quyền**: Apache License 2.0 (100% mã nguồn mở chuẩn OSI, REUSE 3.0)
* **Tài liệu & Sơ đồ kiến trúc**: [`docs/architecture-diagram.svg`](architecture-diagram.svg) | [`INSTALL.md`](../INSTALL.md)

---

### Slide 2: Đặt vấn đề & Nhu cầu Thực tế (Problem Statement)
* **Thực trạng**: Các nhà máy, xí nghiệp, trường đại học quản lý sự cố kỹ thuật qua Zalo, Excel, điện thoại rời rạc $\rightarrow$ Trễ hạn, mất mát thông tin, vi phạm SLA.
* **Mục tiêu**: Xây dựng một nền tảng quản lý hiện trường toàn diện:
  1. Chuẩn hóa quy trình tiếp nhận $\rightarrow$ điều phối $\rightarrow$ xử lý $\rightarrow$ nghiệm thu.
  2. Ứng dụng AI thông minh nhưng phải chịu lỗi cao, hoạt động ngoại tuyến tốt (< 2GB RAM).
  3. Tuân thủ tuyệt đối chuẩn kiến trúc nguồn mở **DX-OS Open-Core** 3 tầng.

---

### Slide 3: Triết lý Kiến trúc DX-OS Open-Core 3 Tầng
* **Nguyên lý "Open-Core First — Application Second"**:
  * **Tầng 1 (Open-Core PaaS)**: Keycloak, Nginx Gateway, PostgreSQL, MinIO, n8n. Hoàn toàn Headless và độc lập với nghiệp vụ FSM (Sẵn sàng tái sử dụng cho bất kỳ bài toán quản lý nào khác như DX-Lab, DX-Farm).
  * **Tầng 2 (Không gian phân rã H-P-D-I)**:
    - **H (Human)**: Quản lý người dùng, kỹ thuật viên, phân quyền RBAC đa vai trò.
    - **P (Process)**: Máy trạng thái ticket 7 bước, SLA monitor worker, Outbox events.
    - **D (Data)**: Chỉ số KPI, gauge SLA thời gian thực, báo cáo tổng hợp.
    - **I (Intelligence)**: Phân loại sự cố NLP 99% accuracy, TF-IDF Knowledge Base, Gợi ý KTV XAI.
  * **Tầng 3 (Ứng dụng Người dùng cuối)**: React 18 SPA Responsive, hỗ trợ đa ngôn ngữ (VI/EN), tối ưu thao tác hiện trường.
* **Sơ đồ kiến trúc hệ thống**: Chiếu trực tiếp vector SVG chuẩn màu sắc hiện đại tại [`docs/architecture-diagram.svg`](architecture-diagram.svg).

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
  - Tích hợp sẵn **120 tickets thực tế** phân bổ đều các danh mục sự cố kỹ thuật HaUI.
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
  3. **Tier 3 (Rule-based Heuristic Fallback)**: Tích hợp Vietnamese Text Normalizer + Intent Precedence, **độ chính xác 99.00% (198/200)**, **Macro F1: 99.6%**.
* **Độ trễ Circuit Breaker siêu tốc**: Trung bình **0.12ms (P95: 0.21ms)**, nhanh gấp 10 lần chuẩn yêu cầu (< 2ms), hoạt động 100% trên CPU không cần GPU/VRAM.

---

### Slide 8: Cẩm nang Kỹ thuật: Semantic Knowledge Base (A5.2)
* **Thuật toán cốt lõi**: TF-IDF + Cosine Similarity thuần Python kết hợp **Domain Semantic Expansion** (Cầu nối ngữ nghĩa).
* **Vượt qua rào cản ngữ nghĩa**:
  - Tự động ánh xạ và mở rộng các từ đồng nghĩa chuyên ngành (`mất tín hiệu mạng` $\leftrightarrow$ `WiFi mất kết nối`, `mạng LAN`, `internet`).
  - Điểm số đạt **0.74** cho các truy vấn từ vựng đời thường thay vì 0.00 như TF-IDF truyền thống.
* **Trải nghiệm hỗ trợ hiện trường**:
  - Tự động gợi ý cẩm nang giải pháp ngay khi gõ mô tả sự cố (debounced 300ms).
  - Nút **"Chèn vào mô tả"** 1-click đưa giải pháp kỹ thuật vào phiếu công tác.

---

### Slide 9: Điều phối Thông minh: Đề xuất KTV Đa tiêu chí & Explainable AI (A5.3)
* **Mô hình Chấm điểm Đa tiêu chí (Multi-factor Scoring)**:
  $$\text{Score} = 40\% \text{ Chuyên môn} + 15\% \text{ Kỹ năng} + 20\% \text{ Đánh giá} + 15\% \text{ Tải việc} + 10\% \text{ Thâm niên \& Lịch sử}$$
* **Explainable AI (XAI) Minh bạch**:
  - Tự động phân tách từng thành phần điểm số hiển thị huy hiệu trực quan trên giao diện:
    `[Chuyên môn: +40]` `[Đánh giá: +18.6]` `[Tải việc: +9.4]` `[Kỹ năng: +7.5]`.
  - Giúp Điều phối viên nắm rõ căn cứ toán học, chống thiên vị và tránh quá tải cho kỹ thuật viên.

---

### Slide 10: An toàn Thông tin & Tuân thủ Nghị định 13/2023/NĐ-CP (PDPD)
* **Bảo vệ Dữ liệu Cá nhân Toàn diện**:
  - Tự động phát hiện và che số CCCD (`[CCCD-n]`), số điện thoại (`[SĐT-n]`), thư điện tử (`[EMAIL-n]`).
  - **Contextual Vietnamese NER**: Tự động che họ tên người có xưng hô (`thầy Đỗ Đăng Trường`, `cô Lan`) thành `[TÊN-n]`.
  - Danh sách Whitelist kỹ thuật (`Windows`, `Cisco`, `TP-Link`, `HaUI`) đảm bảo **0% che nhầm**.
* **Chính sách Secret-Zero & RBAC 4 Vai trò**:
  - 100% không hardcode mật khẩu, khóa bí mật hay token trong mã nguồn.
  - Phân quyền nghiêm ngặt: `customer`, `technician`, `manager`, `admin`.

---

### Slide 11: Kiểm thử Toàn diện & Tuân thủ Nguồn mở (Quality & Open Source)
* **Kiểm thử Tự động Toàn diện (Tiêu chí 7-11)**:
  - Frontend: **332 tests / 43 test suites PASSED 100%** (Vitest + React Testing Library).
  - Backend: **258 tests PASSED 100%** (Ticket Service, AI Service, Notification Service).
  - Tổng cộng: **590 automated tests (100% Pass)**.
* **Tuân thủ Bản quyền & Bằng chứng 100 điểm**:
  - **Tiêu chí 2 (10đ)**: 233/233 tệp mã nguồn gắn nhãn bản quyền `SPDX-License-Identifier: Apache-2.0` và REUSE.toml.
  - **Tiêu chí 4 (10đ)**: Hướng dẫn cài đặt độc lập chuẩn ([`INSTALL.md`](../INSTALL.md)) qua Docker Compose.
  - **Tiêu chí 5 (10đ)**: Quản lý phụ thuộc và SBOM minh bạch ([`DEPENDENCIES.md`](../DEPENDENCIES.md)).

---

### Slide 12: Tổng kết, Kịch bản Demo 3 Luồng & Trả lời Chất vấn (Q&A)
* **3 Giá trị Cốt lõi của FixFlow**:
  1. **Chuẩn mực Open-Core**: Tầng 1 PaaS độc lập, tái sử dụng tối đa cho các bài toán quản lý khác.
  2. **Trí tuệ Nhân tạo Thực dụng**: Chịu lỗi cao, chạy CPU nhẹ (< 2GB RAM cho 11 container), giải thích được (XAI).
  3. **Vận hành Hiện trường Toàn diện**: Quy trình khép kín, minh bạch từ tiếp nhận đến nghiệm thu.
* **Kịch bản Demo Sẵn sàng (10 Phút)**:
  - **Luồng 1 (Khách hàng)**: Báo sự cố kỹ thuật $\rightarrow$ AI phân loại & gợi ý cẩm nang tức thì.
  - **Luồng 2 (Điều phối viên)**: Giám sát Dashboard SLA $\rightarrow$ Phân công KTV với phân rã điểm số XAI.
  - **Luồng 3 (Kỹ thuật viên)**: Nhận việc trên di động $\rightarrow$ Cập nhật tiến độ $\rightarrow$ Hoàn thành nghiệm thu.
  - Lệnh kiểm chứng tự động: `make eval-ai`, `make demo-it-ot`, `make demo-nong-lanh`, `make demo-audit`, `make demo-resilience`.
* **Trân trọng cảm ơn Hội đồng Giám khảo!** Nhóm FixFlow HaUI sẵn sàng trả lời chất vấn.
