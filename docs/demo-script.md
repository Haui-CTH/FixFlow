# Kịch bản Thuyết trình & Demo 10 Phút Chuẩn Cuộc thi PMNM HaUI 2026
### Định dạng: 10 phút Trình bày + 5 phút Trả lời chất vấn Hội đồng Giám khảo

---

## 1. Chuẩn bị trước giờ G (Checklist Kỹ thuật)

1. **Khởi động cụm dịch vụ**:
   ```bash
   docker compose up -d --build
   ```
2. **Kiểm tra trạng thái sức khỏe (Health Check)**:
   - Mở terminal: `make health` hoặc kiểm tra các cổng:
     - Frontend: `http://localhost:3000`
     - Gateway: `http://localhost/health`
     - AI Service: `http://localhost:8002/health`
     - Keycloak: `http://localhost:8080/realms/dx-fsm`
3. **Mở sẵn 2 trình duyệt độc lập** (để demo 2 vai trò song song không bị đè session cookie):
   - **Trình duyệt 1 (Chrome thường)**: Đăng nhập sẵn tài khoản **Manager** (`manager@haui.vn` / `manager123`).
   - **Trình duyệt 2 (Chrome Ẩn danh hoặc Firefox/Edge)**: Chuẩn bị ở trang Login để lát demo vai trò **Customer** (`customer@haui.vn` / `customer123`) và **Technician** (`technician@haui.vn` / `tech123`).
4. **Phương án dự phòng (Offline fallback)**:
   - Thư mục ảnh chụp màn hình đầy đủ: `docs/screenshots/`.
   - Toàn bộ AI Service đã tích hợp cơ chế Circuit Breaker, tự động chạy mượt mà trên CPU mà không cần GPU/Internet.

---

## 2. Kịch bản Trình bày Chi tiết (Khung 10 Phút)

### ⏱ Phút 0:00 – 1:30 | Giới thiệu Bài toán & Kiến trúc Open-Core (Ăn điểm PoF)
* **Người thuyết trình nói**:
  > *"Kính thưa Hội đồng Giám khảo, chúng em là đội DX-FSM. Dự án của chúng em giải quyết bài toán cốt lõi: Quản lý dịch vụ kỹ thuật hiện trường (Field Service Management) cho các nhà máy và xí nghiệp chuyển đổi số.*
  > *Điểm đặc biệt nhất của DX-FSM là tuân thủ 100% định nghĩa **Open-Core First**:*
  > *- **Tầng 1 (PaaS độc lập)**: Keycloak (IAM), Nginx (Gateway), PostgreSQL (DB), n8n (Workflow). Tầng này hoàn toàn headless và trung lập, có thể tái sử dụng cho bất kỳ bài toán quản lý nào khác mà không phải sửa một dòng mã.*
  > *- **Tầng 2 (H-P-D-I)**: Các microservice nghiệp vụ độc lập, đặc biệt là phân hệ AI hybrid.*
  > *- **Tầng 3 (Ứng dụng)**: Giao diện Web SPA React 18 đa ngôn ngữ, hỗ trợ PWA."*
* **Thao tác màn hình**: Chiếu sơ đồ kiến trúc 3 tầng trong `docs/architecture.md` hoặc slide kiến trúc.

---

### ⏱ Phút 1:30 – 3:30 | Luồng 1: Khách hàng báo sự cố & AI Hỗ trợ tức thì
* **Thao tác**: Mở Trình duyệt Ẩn danh $\rightarrow$ Đăng nhập `customer@haui.vn` $\rightarrow$ Bấm **Tạo Ticket mới**.
* **Thao tác & Lời thuyết minh**:
  1. Gõ Tiêu đề: *"Máy in HP tầng 3 bị kẹt giấy và nhấp nháy đèn cam"*.
  2. **Điểm nhấn AI Phân loại**:
     > *"Ngay khi khách hàng nhập thông tin, hệ thống tự động phân loại sự cố vào danh mục **hardware** và mức độ ưu tiên **high** với độ tin cậy > 90%. Nếu AI offline, bộ máy Rule-based regex bản địa sẽ fallback tức thì trong < 2ms."*
  3. **Điểm nhấn Knowledge Base (TF-IDF)**:
     > *"Đồng thời, bên dưới xuất hiện ngay khối **Gợi ý Giải pháp từ Cẩm nang Kỹ thuật (Knowledge Base)** với bài viết 'Khắc phục kẹt giấy máy in HP'. Khách hàng có thể bấm xem nhanh hoặc bấm nút **Chèn vào mô tả** chỉ với 1 click."*
  4. Bấm **Tạo Ticket** $\rightarrow$ Thông báo thành công và chuyển về danh sách.

---

### ⏱ Phút 3:30 – 5:30 | Luồng 2: Manager Điều phối & AI Recommender Phân công KTV
* **Thao tác**: Chuyển sang Trình duyệt Chrome thường (đã đăng nhập sẵn `manager@haui.vn`).
* **Thao tác & Lời thuyết minh**:
  1. **Dashboard Thời gian thực**:
     > *"Tại trang Tổng quan của Manager, các chỉ số KPI, đồng hồ đo cam kết SLA (SLA Gauge), và giám sát Outbox được làm mới tự động theo thời gian thực."*
  2. Mở Ticket vừa tạo $\rightarrow$ Bấm nút **Phân công (Assign)**:
     > *"Khi modal Phân công mở ra, AI Recommender được gọi. Hệ thống không chọn ngẫu nhiên mà tính điểm đa tiêu chí: 40% Chuyên môn kỹ thuật, 30% Số lượng việc đang xử lý, và 30% Đánh giá lịch sử. Hệ thống hiển thị huy hiệu **'AI Đề xuất (95%)'** cho Kỹ thuật viên Nguyễn Văn An kèm lý do minh bạch."*
  3. Bấm xác nhận phân công cho KTV được đề xuất.

---

### ⏱ Phút 5:30 – 7:30 | Luồng 3: Kỹ thuật viên Xử lý & Nghiệm thu Đóng Ticket
* **Thao tác**: Quay lại Trình duyệt ẩn danh $\rightarrow$ Đăng xuất Customer $\rightarrow$ Đăng nhập `technician@haui.vn`.
* **Thao tác & Lời thuyết minh**:
  1. **Nhận việc & RBAC**:
     > *"KTV nhận được chuông thông báo có việc mới. Nhờ hệ thống phân quyền RBAC qua Keycloak, KTV chỉ nhìn thấy các nút thao tác hợp lệ."*
  2. Bấm **Bắt đầu xử lý** $\rightarrow$ Trạng thái chuyển sang `in_progress`.
  3. Thêm **Ghi chú nội bộ (Internal Note)**: *"Đã thay cụm sấy và vệ sinh trục cuốn"* $\rightarrow$ Khách hàng không thể thấy ghi chú bảo mật này.
  4. Bấm **Đã giải quyết (Resolve)**.
  5. Đăng nhập lại `customer@haui.vn` $\rightarrow$ Bấm **Xác nhận & Đóng ticket** $\rightarrow$ Hoàn thành trọn vẹn quy trình FSM chuẩn quốc tế.

---

### ⏱ Phút 7:30 – 9:00 | Điểm nhấn Kỹ thuật: Khả năng Chịu lỗi & Transactional Outbox
* **Người thuyết trình nói & Demo nhanh**:
  1. **Transactional Outbox Pattern**:
     > *"Hệ thống áp dụng mô hình Outbox để chống mất mát dữ liệu giữa PostgreSQL và n8n/Email Service khi có sự cố mạng. Mỗi thay đổi trạng thái đều được lưu nguyên tử (atomic) vào bảng `outbox_events` kèm cơ chế Exponential Backoff và Circuit Breaker."*
  2. **Graceful Degradation (Chịu lỗi mềm của AI)**:
     > *"Đặc biệt, phân hệ AI của chúng em được thiết kế có Circuit Breaker. Nếu máy chủ hiện trường không có card đồ họa GPU hoặc Ollama bị tắt, hệ thống tự động chuyển sang bộ máy Rule-based NLP và TF-IDF chạy bằng CPU trong vòng 2ms, đảm bảo quy trình nhà máy không bị gián đoạn dù chỉ 1 giây!"*
* **Thao tác**: Mở tab `http://localhost:8002/health` chứng minh hệ thống đang công bố `engine_fallback: "rule_based_active"` rất rõ ràng và minh bạch.

---

### ⏱ Phút 9:00 – 10:00 | Báo cáo Chất lượng & Bản quyền Nguồn mở 100%
* **Người thuyết trình chốt lại**:
  > *"Để đảm bảo tính nghiêm túc của một phần mềm nguồn mở tiêu chuẩn:
  > - **100% tệp mã nguồn (227/227 files)** đều có SPDX License Header chuẩn Apache-2.0.
  > - Có tài liệu **DEPENDENCIES.md** phân tích SBOM và tính tương thích giấy phép nguồn mở của mọi thư viện sử dụng.
  > - Hệ thống đạt **324 unit tests passed** trên frontend và bộ test tự động đầy đủ trên backend.
  > Chúng em xin trân trọng cảm ơn và sẵn sàng nhận câu hỏi từ Hội đồng!"*

---

## 3. Chiến lược Trả lời Chất vấn Hội đồng (5 Phút Q&A)

| # | Câu hỏi thường gặp của Giám khảo | Hướng trả lời ghi điểm tuyệt đối |
|---|---|---|
| 1 | **"Hạ tầng Open-Core PaaS của em có bị dính chặt với nghiệp vụ FSM không?"** | *"Dạ thưa thầy, tầng 1 (Keycloak, Nginx, PostgreSQL, n8n) hoàn toàn headless, độc lập 100%. Em có thể giữ nguyên tầng 1 này và thay ứng dụng FSM bằng một hệ thống ERP hoặc E-commerce khác mà không phải cấu hình lại hạ tầng."* |
| 2 | **"AI của em có phải là 'trang trí' không? Nếu không có mạng hoặc máy yếu thì sao?"** | *"Dạ thưa thầy, AI của em là kiến trúc Hybrid 2 tầng. Tầng lõi chạy 100% offline bằng CPU (Regex trọng số cho phân loại, TF-IDF cho KB, và Scorer đa tiêu chí cho KTV). LLM chỉ là tùy chọn tăng cường khi có GPU."* |
| 3 | **"Dự án của em giải quyết vấn đề rò rỉ thông tin mật (Secrets) thế nào?"** | *"Toàn bộ cấu hình nhạy cảm đều dùng biến môi trường. Chúng em có tích hợp script kiểm tra bảo mật `scripts/check-secrets.cjs` trong git pre-commit hook, nếu ai vô tình commit secret hay mật khẩu là git sẽ tự động chặn lại."* |
| 4 | **"Tại sao lại dùng Outbox Pattern mà không gọi trực tiếp webhook sang n8n?"** | *"Gọi trực tiếp rất dễ bị lỗi Dual-Write: DB đã lưu nhưng mạng chập chờn làm mất thông báo. Outbox Pattern lưu sự kiện vào cùng transaction của DB, worker quét định kỳ và gửi lại theo Exponential Backoff, đảm bảo ít nhất một lần gửi (At-least-once delivery)."* |
| 5 | **"Giấy phép Apache-2.0 của dự án có bị xung đột với các thư viện n8n hay thư viện khác không?"** | *"Chúng em đã lập bảng ma trận tương thích giấy phép trong file `DEPENDENCIES.md`. Các thành phần lõi đều là Apache-2.0, MIT, BSD; n8n chạy độc lập dưới dạng container trung gian nên hoàn toàn tuân thủ pháp lý nguồn mở."* |
