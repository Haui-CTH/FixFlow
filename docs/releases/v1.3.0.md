# DX-FSM v1.3.0 — Release Notes
### Bản Phát Hành Chính Thức Cuộc Thi Phần Mềm Nguồn Mở HaUI 2026 (Official PMNM 2026 Release)

> **Ngày phát hành:** 27/10/2026  
> **Phiên bản:** `v1.3.0`  
> **Mục tiêu:** Hoàn thiện 100% tiêu chí chấm điểm Hội đồng (50 điểm PoF + 50 điểm Product)  
> **Giấy phép:** Apache License 2.0 (100% Open Source)

---

## 🎯 1. Tổng quan Bản phát hành v1.3.0

Phiên bản **v1.3.0** đánh dấu cột mốc hoàn thiện toàn diện của nền tảng **DX-FSM**, đưa hệ thống từ giai đoạn phát triển nội bộ sang trạng thái **Production-Ready & Competition-Ready**:

1. **Bộ Dữ liệu Mẫu Thực tế Chuẩn Doanh nghiệp**: Bổ sung bộ dữ liệu 77+ sự cố kỹ thuật bám sát bối cảnh Đại học Công nghiệp Hà Nội (HaUI), đầy đủ cả 7 danh mục sự cố, 7 trạng thái vòng đời, hội thoại bình luận, ghi chú nội bộ và lịch sử kiểm toán.
2. **Đồng bộ Toàn diện 7 Danh mục Sự cố (7 Categories Sync)**: Khớp hoàn hảo giữa CSDL PostgreSQL, backend Ticket Service, AI Classifier, và Frontend UI.
3. **Phân hệ AI Thông minh & Chịu lỗi Cao (Resilient AI & Circuit Breaker)**:
   - Gợi ý phân công KTV bằng dữ liệu thật (8 UUID KTV thật với chấm điểm đa tiêu chí: 40% Chuyên môn + 30% Tải việc + 30% Đánh giá).
   - Tích hợp Cẩm nang Kỹ thuật (Knowledge Base TF-IDF) gợi ý giải pháp tức thì trên màn hình Tạo Ticket và Chi tiết Ticket.
   - Cơ chế tự ngắt chuyển mạch (Circuit Breaker) bảo đảm hệ thống tự động fallback sang bộ máy Rule-based NLP < 2ms khi không có card GPU hoặc Ollama tắt.
4. **Chuẩn mực Bản quyền Nguồn mở Tuyệt đối**:
   - **227/227 tệp mã nguồn (100.00%)** gắn header bản quyền chuẩn `SPDX-License-Identifier: Apache-2.0`.
   - Bổ sung tài liệu Quản lý phụ thuộc & SBOM hoàn chỉnh ([`DEPENDENCIES.md`](DEPENDENCIES.md)).
5. **Chất lượng Kiểm thử & An toàn Thông tin**:
   - Bộ test Frontend đạt **324 tests / 42 test suites passed 100%**.
   - Bộ kiểm tra bảo mật pre-commit tự động ngăn chặn rò rỉ credential (`scripts/check-secrets.cjs`).

---

## ✨ 2. Chi tiết Tính năng Mới (New Features)

### 2.1. Dữ liệu Mẫu Thực tế & Đo lường SLA (Migration 006)
- **Tập dữ liệu 77+ ticket thực tế**: Mô phỏng sự cố tại các tòa nhà A, B, C, xưởng cơ khí, phòng lab và trung tâm khảo thí HaUI.
- **7 Danh mục sự cố**: `hardware`, `software`, `network`, `electrical`, `access_control`, `service_request`, `other`.
- **Hội thoại & Ghi chú**:
  - Trao đổi tự nhiên giữa khách hàng và kỹ thuật viên qua bảng `ticket_comments`.
  - Ghi chú bảo mật dành riêng cho nhân viên kỹ thuật qua bảng `ticket_notes`.
  - Kiểm toán lịch sử thay đổi trạng thái đầy đủ qua bảng `ticket_history`.
- **Chỉ số SLA thực tế**: Phân bổ thời gian tạo và hạn xử lý hợp lý, mang lại tỷ lệ tuân thủ SLA ~92% trên Dashboard.

### 2.2. Trí tuệ Nhân tạo Phân công KTV Thật (Phase P4)
- Ánh xạ 100% KTV với UUID cố định trong CSDL (`d0000000-0000-0000-0000-000000000001` đến `...08`).
- Tích hợp API `aiApi.recommend` vào modal phân công [`AssignModal.tsx`](app/src/components/TicketDetail/AssignModal.tsx).
- Hiển thị huy hiệu **"AI Đề xuất (XX%)"** kèm lý do minh bạch dựa trên chuyên môn, khối lượng việc đang nhận và điểm đánh giá.

### 2.3. Tích hợp Knowledge Base trên Giao diện (Phase P5)
- Component [`KbSuggestions.tsx`](app/src/components/KnowledgeBase/KbSuggestions.tsx) tự động tìm kiếm giải pháp theo thời gian thực (debounce 300ms) dựa trên tiêu đề và mô tả sự cố.
- Hiển thị tức thì trên màn hình **Tạo Ticket** và sidebar màn hình **Chi tiết Ticket**.
- Hỗ trợ xem nhanh nội dung trong Modal và chèn trực tiếp nội dung cẩm nang vào ticket chỉ với 1 click.
- Bổ sung gateway proxy route `/api/v1/kb/` trong Nginx.

### 2.4. Khả năng Chịu lỗi Cao cho AI (Phase P0/P1/P2/P6)
- Tích hợp **Circuit Breaker**: Phát hiện nhanh trạng thái Ollama sau 2s, kích hoạt cooldown 15s để chuyển sang bộ máy Rule-based NLP tức thì.
- **Dynamic Health Probe**: Endpoint `/health` của AI Service kiểm tra động `/api/tags`, công bố `engine_fallback: "rule_based_active"` mà không làm chết container khi không có GPU.
- Hỗ trợ mạng nội bộ Linux trong Docker Compose qua `extra_hosts: ["host.docker.internal:host-gateway"]`.

### 2.5. Hồ sơ Tài liệu Phục vụ Thi đấu Toàn diện
- [`docs/technical-report.md`](docs/technical-report.md): Báo cáo kỹ thuật chi tiết theo chuẩn 100 điểm của Hội đồng.
- [`docs/demo-script.md`](docs/demo-script.md): Kịch bản thuyết trình & demo 10 phút chuẩn + chiến lược 5 phút trả lời chất vấn.
- [`docs/slides.md`](docs/slides.md): Dàn ý 12 slide thuyết trình ngắn gọn, ấn tượng.
- [`DEPENDENCIES.md`](DEPENDENCIES.md): Phân tích chi tiết SBOM và tính tương thích giấy phép nguồn mở.

---

## 🧪 3. Kết quả Kiểm thử & Đo lường Chất lượng

```
============================================================
              DX-FSM TEST EXECUTION REPORT
============================================================
  Frontend Unit Tests (Vitest)  : 324 passed / 42 test files (100%)
  Backend Ticket Service        : 141 passed, 16 skipped
  Backend AI Service            : 74 passed
  Backend Notification Service  : 32 passed
  SPDX License Header Coverage  : 227 / 227 code files (100.00%)
  Secrets Scanner Audit         : 0 secrets detected (CLEAN)
============================================================
```

---

## 🚀 4. Hướng dẫn Khởi chạy & Trải nghiệm

Chỉ với 1 lệnh duy nhất qua Docker Compose:

```bash
# 1. Clone và khởi động toàn bộ dịch vụ
git clone https://github.com/truong-newbie/PMNM_2026_DX_FSM.git
cd PMNM_2026_DX_FSM
docker compose up -d --build

# 2. Truy cập ứng dụng
# Frontend UI:       http://localhost:3000
# Keycloak SSO:      http://localhost:8080 (Admin: admin / <env>)
# API Gateway:       http://localhost/api/v1/tickets
# Workflow n8n:      http://localhost:5678

# 3. Tài khoản demo có sẵn dữ liệu thực tế
# Manager:     manager@haui.vn    / manager123
# Technician:  technician@haui.vn / tech123
# Customer:    customer@haui.vn   / customer123
```

---

## 👥 5. Tác giả & Đóng góp

- **Dự án**: DX-FSM — Field Service Management Platform
- **Đơn vị**: Đại học Công nghiệp Hà Nội (HaUI)
- **Cuộc thi**: Phần mềm Nguồn mở HaUI 2026 / OLP PMNM 2026 (VFOSSA)
- **Tác giả commit**: `truong-newbie <dangtruong3122005@gmail.com>`
- **Giấy phép**: Apache License 2.0
