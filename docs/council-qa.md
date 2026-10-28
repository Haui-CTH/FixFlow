# Bộ Câu hỏi & Trả lời Phản biện Hội đồng Giám khảo (Council Q&A)

> **Dự án:** FixFlow — Nền tảng Quản lý Dịch vụ Kỹ thuật Thực địa (DX-FSM) trên nền DX-OS Open-Core  
> **Cuộc thi:** Olympic Tin học Sinh viên Việt Nam 2026 — Khối Phần mềm Nguồn mở (OLP PMNM 2026)  
> **Thời lượng bảo vệ:** 10 phút thuyết trình & demo, 5 phút trả lời phản biện Hội đồng.

---

## 1. Open-Core nằm ở đâu? Thành phần nào chạy headless và ứng dụng Tầng 2 dùng lõi thế nào?

- **Vị trí Open-Core (Tầng 1):** Toàn bộ Tầng 1 là nền tảng dịch vụ lõi chạy ngầm (**headless PaaS**), hoàn toàn không có giao diện người dùng cuối, được định nghĩa độc lập tại [`docker-compose.core.yml`](../docker-compose.core.yml):
  1. **Định danh & Phân quyền (Identity/SSO):** Keycloak 24 (chuẩn OIDC, PKCE S256, Realm `dx-fsm`).
  2. **Cổng giao tiếp biên (API Gateway):** Nginx Gateway (Port 80) kiểm soát truy cập, định tuyến Same-Origin, chống phân mảnh cổng.
  3. **Quản trị dữ liệu cấu trúc:** PostgreSQL 16 với 6 bản migration phân tầng (`core/postgres/migrations/`).
  4. **Quản trị dữ liệu phi cấu trúc (Object Storage):** MinIO S3 bucket `fsm-attachments` với cơ chế tự khởi tạo bucket và fallback đĩa cục bộ.
  5. **Động cơ luồng công việc & Tích hợp (Workflow Engine):** n8n Workflow Automation.
  6. **Giao vận truyền thông (Communication):** Notification Service định tuyến Email SMTP (MailHog), SMS, Webhook.
- **Ứng dụng Tầng 2 (FixFlow FSM):** Giao diện Web SPA ([`app/`](../app/)) và bộ microservices nghiệp vụ kết nối vào Tầng 1 qua API Gateway duy nhất trên cổng 80 bằng JWT Bearer Token.
- **Minh chứng:** Chạy `make demo-core` để chứng minh Tầng 1 khởi động và phục vụ độc lập mà không cần bất kỳ container giao diện nào.

---

## 2. Vì sao chọn kiến trúc và công nghệ này? Bản quyền nguồn mở ra sao?

- **Lý do lựa chọn:**
  - **Tối ưu tài nguyên & độ tin cậy:** Sử dụng Python FastAPI cho các microservices nghiệp vụ giúp toàn bộ 10 container chỉ tiêu thụ ~1.8 GB RAM, khởi động trong 15 giây, chạy ổn định trên laptop sinh viên và máy chủ cá nhân 8 GB RAM.
  - **Khả năng chịu lỗi cao (Resilience):** Tích hợp Circuit Breaker Pattern cho AI (<2ms fallback) và Storage Fallback (MinIO $\leftrightarrow$ Local Disk).
- **Tuân thủ Giấy phép Bản quyền (OSI Approved):**
  - Toàn bộ mã nguồn tự phát triển phát hành theo giấy phép **Apache-2.0** ([`LICENSE`](../LICENSE)).
  - Các phần mềm nguồn mở thượng nguồn sử dụng nguyên bản (Keycloak, PostgreSQL, Nginx, FastAPI, React) đều có giấy phép tương thích chuẩn OSI (Apache-2.0, MIT, PostgreSQL License, BSD-3-Clause).
  - Không sử dụng các phần mềm có giấy phép thương mại hạn chế (Non-OSI) như Elastic v2 (SSPL), Vault v1.15+ (BUSL). Chi tiết tại [`docs/licenses-audit.md`](licenses-audit.md).

---

## 3. Nếu thay đổi ứng dụng nghiệp vụ, Open-Core có phải sửa đổi không?

- **Hoàn toàn KHÔNG:**
  - Lõi Tầng 1 hoàn toàn không chứa logic nghiệp vụ đặc thù của Field Service Management.
  - Tầng 1 chỉ cung cấp các năng lực nền tảng dạng hợp đồng chuẩn: cấp phát OIDC Token, lưu trữ đối tượng S3, định tuyến reverse proxy, lưu trữ quan hệ CSDL và đẩy sự kiện Outbox/Webhook.
  - Một ứng dụng nghiệp vụ khác (ví dụ: Quản lý Kho, Văn phòng điện tử, Nông nghiệp số) hoàn toàn có thể cắm vào Tầng 1 bằng cách khai báo thêm một OIDC Client trên Keycloak và một bảng schema riêng trên PostgreSQL mà không cần sửa một dòng mã nào của Open-Core.

---

## 4. Điểm nào thể hiện H-P-D-I thay vì chỉ là một phần mềm CRUD thông thường?

FixFlow được thiết kế bao phủ toàn diện 4 trục năng lực số:

| Trục | Hiện thực hóa trên FixFlow (Khác biệt so với CRUD) | Minh chứng trong mã nguồn |
| :--- | :--- | :--- |
| **[H] Human** | Phân quyền 4 vai trò rõ rệt (Admin, Manager, Technician, Customer). Giao diện tối ưu công thái học hiện trường: Dark/Light mode chống lóa ngoài trời, mobile responsive, đạt chuẩn tương phản màu sắc **WCAG 2.2 AA (>= 4.5:1)**. | [`app/src/test/contrast.test.ts`](../app/src/test/contrast.test.ts) (332 unit tests) |
| **[P] Process** | Động cơ chuyển trạng thái hữu hạn (FSM) kiểm soát vòng đời vé: `new` $\rightarrow$ `assigned` $\rightarrow$ `in_progress` $\rightarrow$ `pending_customer` $\rightarrow$ `resolved` $\rightarrow$ `closed`. Khóa trạng thái sai quyền, đo đếm SLA phản hồi & xử lý. | [`services/ticket-service/app/services/ticket_service.py`](../services/ticket-service/app/services/ticket_service.py) |
| **[D] Data** | Mô hình dữ liệu phân tầng, lưu trữ ảnh/tệp đính kèm trên MinIO S3, lưu nhật ký biến động trạng thái (History Timeline), sổ kiểm toán Outbox Event chống thất thoát sự kiện tích hợp. | [`services/ticket-service/app/models/history.py`](../services/ticket-service/app/models/history.py) |
| **[I] Intelligence** | Bộ 3 tác tử AI thực dụng: (1) Phân loại tự động có Circuit Breaker < 2ms; (2) Thuật toán gợi ý KTV đa tiêu chí (40% chuyên môn + 30% tải việc + 30% đánh giá); (3) Cẩm nang tri thức TF-IDF tra cứu tức thì; (4) Che thông tin cá nhân PII. | [`services/ai-service/app/`](../services/ai-service/app/) |

---

## 5. AI có bịa (hallucinate) không? Dữ liệu nhạy cảm có bị lộ không? Khi máy chủ không có GPU thì sao?

- **Chống ảo giác (Anti-Hallucination):**
  - Tác tử tra cứu tri thức (Knowledge Base) sử dụng giải thuật **TF-IDF Vector Space Model** trích xuất chính xác giải pháp kỹ thuật từ cẩm nang đã được chuyên gia phê duyệt, trả về đúng số bước khắc phục, không sinh từ ngẫu nhiên.
  - Thuật toán phân công KTV tính điểm tường minh dựa trên ma trận toán học (Scoring weights: Expertise, Workload, Rating) $\rightarrow$ Kiểm chứng được lý do gợi ý, không phải hộp đen.
- **Bảo vệ quyền riêng tư (PII Masking theo Nghị định 13/2023/NĐ-CP):**
  - Tự động quét và che số Căn cước công dân (12 chữ số), số điện thoại Việt Nam (+84 / 09x, 08x...), email cá nhân trước khi đưa vào mô hình phân tích hoặc nhật ký hệ thống.
  - Minh chứng: Chạy `make demo-pii`.
- **Hoạt động không cần GPU (Graceful Degradation):**
  - Toàn bộ pipeline AI được tối ưu hóa chạy trực tiếp trên CPU phổ thông.
  - Trang bị **Circuit Breaker Pattern**: Nếu thời gian phản hồi vượt quá 2.0s hoặc AI Service gián đoạn, hệ thống tự động ngắt mạch và kích hoạt bộ phân loại heuristic dự phòng trong **< 2ms**, đảm bảo người dùng tại hiện trường không bao giờ bị nghẽn thao tác.
  - Minh chứng: Chạy `make demo-ai`.

---

## 6. Nếu một dịch vụ thành phần bị sập (MinIO, AI...), hệ thống xử lý ra sao?

- **Khả năng chịu lỗi lưu trữ (Storage Resilience):**
  - Khi MinIO S3 hoạt động: tệp đính kèm được lưu trữ trên bucket S3 chuẩn doanh nghiệp.
  - Khi MinIO bị tắt hoặc ngắt kết nối: `StorageService` trong ticket-service tự động phát hiện và chuyển tiếp liền mạch sang lưu trữ đĩa cục bộ (`/data/attachments/`), trả về kết quả 200 OK cho người dùng mà không gián đoạn giao dịch.
- **Khả năng chịu lỗi AI:**
  - Circuit Breaker fallback sang Rule-based classification ngay lập tức.
- **Khả năng chịu lỗi CSDL:**
  - Áp dụng Transactional Outbox Pattern: sự kiện gửi thông báo (email/sms/push) được ghi đồng thời vào CSDL cùng giao dịch vé. Nếu Notification Service tạm dừng, sự kiện vẫn được giữ an toàn và gửi bù ngay khi dịch vụ phục hồi.

---

## 7. Hội tụ IT/OT (Nguyên lý ii của DX-OS) thể hiện ở đâu trong FixFlow?

- **Bản chất nghiệp vụ:** Trong Quản lý Dịch vụ Hiện trường (FSM), hội tụ IT/OT là năng lực cốt lõi: kết nối trực tiếp thiết bị máy móc, cảm biến hiện trường (OT) với quy trình điều phối kỹ thuật (IT).
- **Hiện thực hóa:**
  - Tích hợp cổng nhận tín hiệu Telemetry từ cảm biến IoT (nhiệt độ phòng máy, rung chấn động cơ, điện áp).
  - Khi cảm biến đo được thông số vượt ngưỡng khẩn cấp (vd: nhiệt độ phòng máy chủ Lab 402 đạt 88.5°C > ngưỡng 80°C) $\rightarrow$ Cảm biến tự động gửi bản tin cảnh báo qua API Gateway (được xác thực bằng Keycloak OIDC Token).
  - FixFlow tự động tạo Ticket sự cố khẩn cấp (Priority: Critical), tính toán SLA phản hồi 15 phút, và AI tự động đề xuất kỹ thuật viên phần cứng phụ trách ca trực.
- **Minh chứng:** Chạy `make demo-it-ot` (hoặc `python scripts/demo_iot_sensor.py`).

---

## 8. Phân tách Dữ liệu Nóng - Lạnh (Nguyên lý i của DX-OS) thực hiện như thế nào?

- **Dữ liệu Nóng (OLTP):**
  - Bảng `tickets`, `ticket_history`, `comments` phục vụ các truy vấn điều hành thời gian thực trên PostgreSQL, có chỉ mục tối ưu B-Tree và phân trang debounced.
- **Dữ liệu Lạnh (Archive):**
  - Tệp ảnh hiện trường, biên bản bàn giao nghiệm thu được lưu trữ tại kho đối tượng MinIO S3.
  - Các vé đã đóng (`closed`) quá thời hạn lưu trữ vận hành được đóng gói thành các bản ghi nén định dạng Parquet/JSON lịch sử, giải phóng bộ nhớ đệm và chỉ mục của CSDL PostgreSQL nóng.

---

## 9. Người khác có thể tự cài đặt và tái lập toàn bộ hệ thống từ mã nguồn được không?

- **Hoàn toàn dễ dàng chỉ với 1 lệnh:**
  ```bash
  git clone https://github.com/truong-newbie/PMNM_2026_DX_FSM.git
  cd PMNM_2026_DX_FSM
  make setup-env    # Tạo tệp cấu hình mẫu .env
  make up           # Khởi chạy toàn bộ hệ thống
  ```
- **Không yêu cầu cài đặt môi trường rườm rà:** Toàn bộ công nghệ (Postgres, Keycloak, Gateway, Backend, AI, Frontend, MinIO, n8n, MailHog) đã được container hóa 100% bằng Docker Compose v2.
- **Dữ liệu demo sẵn có:** Tự động nạp sẵn 77+ vé sự cố thực tế đa dạng tại các tòa nhà HaUI, 8 kỹ thuật viên mẫu, đầy đủ tài khoản thử nghiệm theo từng vai trò (`admin`, `manager`, `technician`, `customer`).

---

## 10. Trải nghiệm đăng nhập và giao diện có đồng nhất tên miền không?

- **Same-Origin / Unified Gateway Routing:**
  - Toàn bộ giao diện Web SPA, xác thực đăng nhập Keycloak OIDC, và các API microservices đều được hội tụ qua cổng duy nhất **Port 80 (Nginx Gateway)**.
  - Người dùng truy cập `http://localhost/` (hoặc tên miền Internet qua Cloudflare Tunnel), khi đăng nhập hệ thống chuyển sang `/realms/dx-fsm/...` trên **cùng một tên miền**, không hề bị nhảy cổng sang `:8080`.
- **Bộ nhận diện thương hiệu FixFlow:**
  - Keycloak được gắn Custom Theme (`fixflow`) với bố cục 2 cột hiện đại: panel thương hiệu xanh Navy bên trái có logo và khẩu hiệu *"Quản lý Dịch vụ Kỹ thuật Thực địa"*, thẻ đăng nhập bo góc thanh lịch bên phải, hỗ trợ chuyển đổi đa ngôn ngữ Tiếng Việt / English.
