# Dàn ý Slide Thuyết trình DX-FSM (12 Slides Chuẩn Barem OLP 2026)
### Đề tài: Nền tảng Quản lý Dịch vụ Thực địa trên nền tảng DX-OS Open-Core
**Cuộc thi Phần mềm Nguồn mở HaUI 2026 (VFOSSA)**

---

### Slide 1: Trang tiêu đề (Title & Team)
* **Tiêu đề chính**: DX-FSM — Digital Transformation Field Service Management
* **Phụ đề**: Nền tảng Quản lý Dịch vụ Thực địa theo kiến trúc DX-OS Open-Core
* **Đơn vị dự thi**: Đại học Công nghiệp Hà Nội (HaUI) — OLP PMNM 2026
* **Tác giả / Nhóm phát triển**: DX-FSM Team
* **Giấy phép bản quyền**: Apache License 2.0 (100% mã nguồn mở)

---

### Slide 2: Đặt vấn đề & Nhu cầu Thực tế (Problem Statement)
* **Thực trạng**: Các nhà máy, xí nghiệp quản lý sự cố kỹ thuật qua Zalo, Excel, điện thoại rời rạc $\rightarrow$ Trễ hạn, mất mát thông tin, vi phạm SLA.
* **Mục tiêu**: Xây dựng một nền tảng quản lý hiện trường toàn diện:
  1. Chuẩn hóa quy trình tiếp nhận $\rightarrow$ điều phối $\rightarrow$ xử lý $\rightarrow$ nghiệm thu.
  2. Ứng dụng AI thông minh nhưng phải chịu lỗi cao, hoạt động ngoại tuyến tốt.
  3. Tuân thủ tuyệt đối chuẩn kiến trúc nguồn mở **DX-OS Open-Core**.

---

### Slide 3: Triết lý Kiến trúc DX-OS Open-Core 3 Tầng
* **"Open-Core First — Application Second"**:
  * **Tầng 1 (Open-Core PaaS)**: Keycloak, Nginx, PostgreSQL, n8n. Hoàn toàn Headless và độc lập với nghiệp vụ FSM (Có thể tái sử dụng cho bất kỳ ứng dụng nào khác).
  * **Tầng 2 (Không gian H-P-D-I)**:
    - **H (Human)**: Quản lý người dùng, KTV, phân quyền RBAC.
    - **P (Process)**: Máy trạng thái ticket, SLA monitor, Outbox event.
    - **D (Data)**: Chỉ số KPI, gauge SLA thời gian thực.
    - **I (Intelligence)**: Phân loại sự cố, TF-IDF KB, Gợi ý KTV.
  * **Tầng 3 (Ứng dụng Client)**: React 18 SPA Responsive, hỗ trợ đa ngôn ngữ (VI/EN).

---

### Slide 4: Hạ tầng Nền tảng Tầng 1 (Open-Core PaaS)
* **Keycloak 24**: Quản trị danh tính tập trung (IAM), SSO, xác thực JWT qua JWKS endpoint (Zero-Secret trong code).
* **Nginx Gateway**: Định tuyến ngược tập trung tại Port 80, SSL termination, reverse proxy tới các microservice.
* **PostgreSQL 16**: Lưu trữ quan hệ chuẩn ACID, hỗ trợ migration tự động.
* **n8n Workflow Automation**: Xử lý logic thông báo tự động (Email, SMS stubs, Escalation Webhooks).

---

### Slide 5: Quy trình Nghiệp vụ & Máy Trạng thái (FSM Workflow & SLA)
* **Máy trạng thái 7 bước nghiêm ngặt**:
  $$\text{new} \rightarrow \text{assigned} \rightarrow \text{in\_progress} \rightarrow \text{pending} \rightarrow \text{resolved} \rightarrow \text{closed}$$
* **Giám sát Cam kết Dịch vụ (SLA Engine)**:
  - Tự động tính hạn phản hồi và hạn xử lý theo độ ưu tiên (`critical`: 4h, `high`: 8h, `medium`: 24h, `low`: 48h).
  - Background worker tính toán trạng thái: `healthy`, `at_risk`, `breached`.
  - Hiển thị trực quan qua đồng hồ SLA Gauge trên Dashboard.

---

### Slide 6: Độ tin cậy Dữ liệu với Transactional Outbox Pattern
* **Vấn đề Dual-Write**: Tránh trường hợp dữ liệu đã lưu vào DB nhưng gọi notification/n8n thất bại do mạng.
* **Giải pháp Transactional Outbox**:
  - Ghi bản ghi sự kiện vào bảng `outbox_events` trong **cùng transaction ACID** của PostgreSQL.
  - Worker nền quét định kỳ (30s) gửi tới n8n / notification service.
  - Tích hợp **Exponential Backoff** và **Circuit Breaker** (chuyển vào Dead Letter Queue sau 5 lần lỗi).

---

### Slide 7: Trí tuệ Nhân tạo Thiết thực: Hybrid Classifier (A5.1)
* **Kiến trúc 3 Tầng chịu lỗi cao (Resilient)**:
  1. **Tier 1 (LRU Cache)**: Hash SHA-256 theo tiêu đề + mô tả, phản hồi < 1ms.
  2. **Tier 2 (Ollama LLM)**: Zero-shot prompt xuất JSON qua mô hình nguồn mở nhẹ (`llama3.2:3b` / `qwen2.5`).
  3. **Tier 3 (Rule-based Regex Fallback)**: Bộ từ khóa trọng số chuyên ngành tiếng Việt & Anh, phản hồi < 2ms, tốn 0 MB VRAM.
* **Circuit Breaker**: Tự động phát hiện Ollama offline, chuyển ngay sang Tier 3 với thời gian trễ bằng 0.

---

### Slide 8: Cẩm nang Kỹ thuật: Semantic Knowledge Base (A5.2)
* **Thuật toán**: TF-IDF + Cosine Similarity thuần Python (chạy 100% bằng CPU).
* **Tối ưu hóa**: Trọng số tiêu đề $\times 3$, tiền xử lý ngôn ngữ tiếng Việt, bảo đảm luồng an toàn bằng `RLock`.
* **Trải nghiệm người dùng (UX)**:
  - Tự động gợi ý tức thì khi người dùng gõ sự cố (debounced 300ms).
  - Hỗ trợ xem nhanh giải pháp và nút **"Chèn vào mô tả"** chỉ với 1 click.

---

### Slide 9: Đề xuất Phân công Kỹ thuật viên Thông minh (A5.3)
* **Chấm điểm Đa tiêu chí (Multi-factor Scoring)**:
  - **40% Khớp chuyên môn**: Ánh xạ 7 lĩnh vực kỹ thuật với kỹ năng của KTV.
  - **30% Tải công việc hiện tại**: Ưu tiên KTV đang có ít ticket `in_progress`.
  - **30% Đánh giá & Hiệu suất**: Dựa trên số sao đánh giá và thời gian xử lý trung bình.
* **Dữ liệu thật**: 100% ánh xạ với UUID thực của KTV trong database PostgreSQL, hiển thị huy hiệu % điểm số và lý do đề xuất minh bạch trên Modal phân công.

---

### Slide 10: An toàn Thông tin & Quản trị Bí mật (Security & IAM)
* **Chính sách Secret Zero**: Không bao giờ hardcode mật khẩu, token trong mã nguồn. 100% cấu hình qua biến môi trường `.env`.
* **Công cụ Kiểm soát Pre-commit**: Script `scripts/check-secrets.cjs` tự động quét các pattern khóa bí mật trước khi commit, chặn đứng nguy cơ lộ lọt credential.
* **Phân quyền RBAC**: 4 role chuẩn (`customer`, `technician`, `manager`, `admin`), kiểm soát chặt chẽ ở cả Frontend (RoleGuard) và Backend (JWT claims).

---

### Slide 11: Kiểm thử Toàn diện & Tuân thủ Nguồn mở (Quality & Open Source)
* **Frontend Tests (Vitest)**: **324 tests / 42 test suites passed 100%**.
* **Backend Tests (Pytest)**: Kiểm thử đầy đủ máy trạng thái, outbox worker, và thuật toán gợi ý.
* **Độ phủ Bản quyền (SPDX Coverage)**: **227/227 tệp mã nguồn (100.00%)** gắn cờ `SPDX-License-Identifier: Apache-2.0`.
* **Tài liệu Phụ thuộc (SBOM)**: File `DEPENDENCIES.md` liệt kê nguồn gốc, phiên bản và ma trận tương thích giấy phép nguồn mở của mọi thư viện.

---

### Slide 12: Tổng kết & Trả lời Chất vấn (Conclusion & Q&A)
* **Giá trị cốt lõi**:
  - Tuân thủ chuẩn mực Open-Core DX-OS.
  - Đáp ứng trọn vẹn nghiệp vụ Field Service Management hiện đại.
  - Kiến trúc chịu lỗi cao (Resilience), hoạt động độc lập không phụ thuộc phần cứng đắt tiền.
* **Trân trọng cảm ơn Hội đồng Giám khảo!**
* **Nhóm DX-FSM sẵn sàng trả lời chất vấn.**
