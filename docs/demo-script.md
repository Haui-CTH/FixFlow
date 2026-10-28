# Kịch bản Thuyết trình & Demo 10 Phút Chuẩn Cuộc thi PMNM HaUI 2026
### Dự án: FixFlow (DX-FSM) — Quản lý Dịch vụ Kỹ thuật Thực địa trên nền DX-OS Open-Core
### Định dạng: 10 phút Trình bày + 5 phút Trả lời chất vấn Hội đồng Giám khảo

> Đọc kèm:
> - [`docs/council-qa.md`](council-qa.md) — 10 câu hỏi & trả lời phản biện chuyên sâu của Hội đồng.
> - [`docs/muc-hoan-thien.md`](muc-hoan-thien.md) — Bảng đối chiếu mức hoàn thiện và độ phủ kiểm thử.
> - [`docs/licenses-audit.md`](licenses-audit.md) — Thẩm định giấy phép nguồn mở chuẩn OSI 100%.

---

## 1. Chuẩn bị trước giờ G (Checklist Kỹ thuật)

1. **Khởi động cụm dịch vụ**:
   ```bash
   make up
   ```
2. **Kiểm tra trạng thái sức khỏe (Health Check & Gateway)**:
   - Truy cập Gateway thống nhất: `http://localhost/health`
   - Cổng giao diện FixFlow: `http://localhost/` (hoặc domain Cloudflare Tunnel)
   - Cổng xác thực Keycloak (FixFlow Theme): `http://localhost/realms/dx-fsm/...`
   - AI Service: `http://localhost/api/v1/ai/health`
3. **Mở sẵn 2 trình duyệt độc lập** (để demo 2 vai trò song song không bị đè session cookie):
   - **Trình duyệt 1 (Chrome thường)**: Đăng nhập sẵn tài khoản **Manager** (`manager` / `manager123`).
   - **Trình duyệt 2 (Chrome Ẩn danh hoặc Firefox/Edge)**: Chuẩn bị ở trang Login Keycloak giao diện FixFlow để lát demo vai trò **Customer** (`customer` / `customer123`) và **Technician** (`technician` / `tech123`).
4. **Phương án dự phòng (Offline fallback)**:
   - Thư mục ảnh chụp màn hình đầy đủ: `docs/screenshots/`.
   - Toàn bộ AI Service đã tích hợp cơ chế Circuit Breaker, tự động chạy mượt mà trên CPU mà không cần GPU/Internet.
   - Lưu trữ tự động chuyển đổi từ MinIO S3 sang Local Disk nếu cụm lưu trữ tạm ngắt.

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

### ⏱ Phút 7:30 – 9:00 | Điểm nhấn Kỹ thuật: Hội tụ IT/OT & Khả năng Chịu lỗi
* **Người thuyết trình nói & Demo nhanh**:
  1. **Hội tụ IT/OT (Nguyên lý ii của DX-OS)**:
     > *"FixFlow kết nối trực tiếp cảm biến phần cứng hiện trường với quy trình IT. Cảm biến quá nhiệt phòng Server Lab 402 tự động bắn bản tin cảnh báo qua Gateway $\rightarrow$ Hệ thống tự sinh Ticket khẩn cấp và AI tính điểm phân công KTV ca trực tức thì!"*
     - Thao tác: Chạy `make demo-it-ot`.
  2. **Graceful Degradation (Chịu lỗi mềm của AI & Storage)**:
     > *"Đặc biệt, phân hệ AI của chúng em được thiết kế có Circuit Breaker. Nếu máy chủ hiện trường không có card đồ họa GPU hoặc Ollama bị tắt, hệ thống tự động chuyển sang bộ máy Rule-based NLP và TF-IDF chạy bằng CPU trong vòng 2ms, đảm bảo quy trình nhà máy không bị gián đoạn dù chỉ 1 giây! Đồng thời tệp đính kèm tự động chuyển S3 $\leftrightarrow$ Local Disk nếu MinIO tạm dừng."*

---

### ⏱ Phút 9:00 – 10:00 | Báo cáo Chất lượng & Bản quyền Nguồn mở 100%
* **Người thuyết trình chốt lại**:
  > *"Để đảm bảo tính nghiêm túc của một phần mềm nguồn mở tiêu chuẩn:
  > - **100% tệp mã nguồn** đều có SPDX License Header chuẩn Apache-2.0, không có giấy phép hạn chế non-OSI.
  > - Hệ thống đạt **332 unit tests passed (43 test suites)** trên frontend, kiểm thử tương phản WCAG 2.2 AA.
  > - Đầy đủ bộ minh chứng: [`docs/muc-hoan-thien.md`](muc-hoan-thien.md) và [`docs/council-qa.md`](council-qa.md).
  > Chúng em xin trân trọng cảm ơn và sẵn sàng nhận câu hỏi từ Hội đồng!"*

---

## 3. Chiến lược Trả lời Chất vấn Hội đồng (5 Phút Q&A)

Chi tiết 10 câu hỏi & trả lời phản biện chuyên sâu: xem tại [`docs/council-qa.md`](council-qa.md).
