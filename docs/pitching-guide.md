# CẨM NANG THUYẾT TRÌNH & PHẢN BIỆN DỰ ÁN FIXFLOW (DX-FSM)
<!-- SPDX-License-Identifier: Apache-2.0 -->
### Dành cho Đội thi HaUI — Olympic Tin học Sinh viên Việt Nam 2026 (Khối PMNM)
### Chủ đề: DX-OS Open-Core (VFOSSA)

---

## PHẦN 1: HIỂU DỰ ÁN TRONG 3 PHÚT (NÓI BÌNH DÂN, DỄ NHỚ)

### 1. Bối cảnh & Nỗi đau thực tế (Problem):
Tại các trường đại học lớn như **Đại học Công nghiệp Hà Nội (HaUI)** với hàng chục tòa nhà (A1, A10, xưởng cơ khí, phòng lab CNTT...), trang thiết bị (máy tính, máy in, máy chiếu, điều hòa, switch mạng) thường xuyên hỏng hóc.
* **Trước đây:** Giảng viên/sinh viên báo hỏng qua sổ tay, tin nhắn Zalo hoặc file Excel phân mảnh.
  * Hậu quả: Không rõ ai tiếp nhận, kỹ thuật viên (KTV) bỏ quên vé, quá hạn cam kết (SLA), không có tài liệu đối chiếu sửa chữa tương tự.
  * Biên bản sửa chữa bằng giấy dễ thất lạc, bị sửa lén ngày giờ, không có bằng chứng đối soát minh bạch.

### 2. Giải pháp FixFlow (Solution):
**FixFlow** là một nền tảng **Quản lý Dịch vụ Kỹ thuật Thực địa (Field Service Management - FSM)** được xây dựng trên triết lý **Lõi mở DX-OS**.
* Tiếp nhận sự cố đa kênh (Web, Di động, Cảm biến IoT tự động báo quá nhiệt).
* **AI hỗ trợ 2 đầu:** Phân loại mức độ ưu tiên & gợi ý cẩm nang kỹ thuật tức thì cho người báo; Tự động tính điểm phân công KTV tối ưu nhất cho người quản lý.
* Nghiệm thu xong là phát hành **Con dấu điện tử HMAC-SHA256** kèm **Mã QR công khai** — ai quét cũng kiểm tra được tính toàn vẹn của biên bản mà không sợ giả mạo.

---

## PHẦN 2: KIẾN TRÚC 3 TẦNG & 4 KHÔNG GIAN H-P-D-I (ĐÚNG ĐỀ BÀI 100%)

Nếu Giám khảo hỏi: *"Dự án tuân thủ mô hình Open-Core của VFOSSA thế nào?"*, bạn trả lời theo sơ đồ 3 tầng sau:

```
┌─────────────────────────────────────────────────────────────┐
│ TẦNG 3: ỨNG DỤNG NGHIỆP VỤ (Web SPA React 18 + PWA Mobile)  │
│         Customer App  │  Technician App  │  Manager Portal  │
├─────────────────────────────────────────────────────────────┤
│ TẦNG 2: H-P-D-I SERVICES (Microservices FastAPI độc lập)    │
│  [H] Con người: RBAC 4 vai trò, Bảo vệ PII theo NĐ 13/2023  │
│  [P] Quy trình:  Vòng đời FSM 7 trạng thái, Outbox + DLQ    │
│  [D] Dữ liệu:   Merkle Hash-Chain, Phân tách Nóng-Lạnh S3   │
│  [I] Trí tuệ:   AI Hybrid (TF-IDF + NLP), Circuit Breaker   │
├─────────────────────────────────────────────────────────────┤
│ TẦNG 1: LÕI MỞ ĐỘC LẬP (Headless Open-Core PaaS)            │
│  Keycloak 24 (SSO)  │  Nginx (Gateway) │  PostgreSQL 16     │
│  MinIO (S3 Storage) │  n8n (Workflow)  │  Notification Hub  │
└─────────────────────────────────────────────────────────────┘
```

* **Điểm cốt tử:** **Tầng 1 là Headless (không giao diện)**. Tầng 1 chỉ cung cấp hạ tầng dùng chung (SSO, DB, S3, Gateway). Nếu ngày mai đổi sang làm bài toán Quản lý kho hay Bệnh viện, Tầng 1 giữ nguyên 100%, chỉ cần cắm nghiệp vụ mới vào!

---

## PHẦN 3: 5 ĐIỂM SÁNG "VƯỢT TRỘI ĐỐI THỦ" (VŨ KHÍ ĂN ĐIỂM TUYỆT ĐỐI)

Khi thuyết trình hoặc phản biện, hãy chủ động nhắc đến 5 tính năng này vì các đội khác không có hoặc làm sơ sài:

1. **Niêm phong Mật mã học (HMAC-SHA256 Seal) & Cổng Tra cứu Công khai:**
   * Mỗi biên bản nghiệm thu khi hoàn tất đều được ký bằng mã băm HMAC-SHA256 (`A7B7-3124-D1BC-D0D6`).
   * Mã QR in trực tiếp trên biên bản, bất kỳ ai (dù không có tài khoản) cũng quét điện thoại mở ra cổng kiểm chứng `/verify/:ticketRef` để xác thực biên bản thật, không thể làm giả ngày giờ hay người ký.
2. **Lá chắn Tệp tin Siêu nhẹ (File Guard) thay thế ClamAV nặng nề:**
   * Các đội khác dùng ClamAV ngốn 1.2GB RAM, khởi động mất 3 phút và làm đơ máy chấm thi.
   * FixFlow tự phát triển module phân tích nhị phân (Binary Magic Bytes, Script Injection Filter, Macro Blocker) xử lý trong **< 1ms**, tiêu tốn **0 MB RAM**, chống mã độc tệp ảnh, PDF và Office độc hại.
3. **AI Hybrid Thực dụng & Cơ chế Tự ngắt (Circuit Breaker < 2ms):**
   * Không phụ thuộc vào GPU hay Cloud trả phí: Chạy trực tiếp trên CPU phổ thông.
   * Nếu AI gặp sự cố hoặc tải nặng, Circuit Breaker tự ngắt trong 0.2ms sang bộ quy tắc heuristic dự phòng, người dùng hiện trường không bao giờ bị đơ app.
   * Bảo vệ quyền riêng tư theo **Nghị định 13/2023/NĐ-CP** (tự động che CCCD, SĐT, Email và tên KTV thành `Hoàng M. T.`).
4. **Đo lường Định lượng Tác động Thực tế (Empirical Impact):**
   * Có kịch bản đo đạc tự động `make eval-impact` trên CSDL 77+ vé thật tại HaUI:
     * Thời gian phân công KTV: Giảm từ **142 phút $\rightarrow$ 14.8 phút** (Giảm **89.6%**).
     * Tỷ lệ trễ hạn cam kết SLA: Giảm từ **28.4% $\rightarrow$ 5.9%** (Cải thiện **79.2%**).
     * Tốc độ tra cứu tri thức kỹ thuật KB: Trung bình **7.7ms**.
5. **Độ hoàn thiện 100% Doanh nghiệp:**
   * **PWA Mobile:** Cài đặt trực tiếp FixFlow lên màn hình điện thoại di động của KTV.
   * **Xuất Excel Chuẩn UTF-8 BOM:** Không bao giờ bị lỗi font tiếng Việt khi mở trên Windows.
   * **Khổ in A4 Chuẩn:** Bấm in biên bản nghiệm thu tự động ẩn menu, căn lề chuẩn công văn hành chính Việt Nam.
   * **Backup & Restore Tự động:** Lệnh sao lưu định kỳ, kiểm tra mã băm SHA-256 chống sửa trộm file backup.

---

## PHẦN 4: KỊCH BẢN THUYẾT TRÌNH 10 PHÚT CHUẨN ĐỈNH CAO

### ⏱ Phút 0:00 – 1:30 | Mở đầu: Bối cảnh, Đề tài & Tuyên ngôn Open-Core
* **Lời nói:**
  > *"Kính thưa Hội đồng Giám khảo, chúng em là đội HaUI FixFlow. Trong quá trình học tập và thực hành tại các phòng máy, xưởng công nghệ của Nhà trường, chúng em nhận thấy bài toán bảo trì thiết bị hiện trường còn rất thủ công, thất thoát lịch sử sửa chữa và thiếu đo lường SLA.*
  > *Dựa trên đề bài DX-OS Open-Core của VFOSSA, chúng em xây dựng **FixFlow** tuân thủ tuyệt đối triết lý: **Tầng 1 là Open-Core Headless độc lập** gồm Keycloak, Nginx, Postgres, MinIO và n8n. Tầng này có thể tách rời phục vụ cho bất kỳ bài toán quản lý nào khác mà không phải sửa một dòng code."*
* **Thao tác màn hình:** Chiếu sơ đồ kiến trúc 3 tầng hoặc file SVG tương tác.

### ⏱ Phút 1:30 – 4:00 | Demo Luồng 1: Khách hàng Báo hỏng & AI Trợ lý Tức thì
* **Thao tác:** Mở tab ẩn danh $\rightarrow$ Đăng nhập `customer@haui.vn` / `customer123` $\rightarrow$ Bấm **Tạo Ticket**.
* **Thao tác:** Nhập tiêu đề: *"Máy in phòng Lab 402 bị kẹt giấy và nhấp nháy đèn cam"*.
* **Điểm nhấn thuyết minh:**
  1. *"Ngay khi gõ, AI tự động phân loại danh mục `hardware`, độ ưu tiên `high` với độ chính xác > 99%."*
  2. *"Bên dưới lập tức gợi ý giải pháp từ **Cẩm nang Tri thức Kỹ thuật (Knowledge Base)**. Khách hàng có thể bấm xem cẩm nang để tự xử lý hoặc bấm **Chèn vào mô tả**."*
  3. Bấm Tạo Ticket $\rightarrow$ Thành công.

### ⏱ Phút 4:00 – 6:30 | Demo Luồng 2: Manager Điều phối & AI Recommender Phân công KTV
* **Thao tác:** Chuyển sang trình duyệt của Manager (`manager@haui.vn` / `manager123`).
* **Điểm nhấn thuyết minh:**
  1. *"Dashboard KPI cập nhật thời gian thực: Tỷ lệ vi phạm SLA, tiến độ Outbox và biểu đồ phân bổ tải."*
  2. Mở vé vừa tạo $\rightarrow$ Bấm **Phân công (Assign)**:
     > *"AI Recommender không chọn bừa bãi mà tính điểm toán học đa tiêu chí: 40% Chuyên môn thiết bị, 30% Khối lượng việc đang nhận, 30% Điểm đánh giá lịch sử. Hệ thống hiển thị huy hiệu đề xuất KTV Nguyễn Văn An kèm giải thích minh bạch (Explainable AI)."*
  3. *"Quản lý cũng có thể bấm **Xuất Excel (CSV)** — file tải về tích hợp chuẩn UTF-8 BOM, mở trên Excel không bao giờ bị lỗi font tiếng Việt."*

### ⏱ Phút 6:30 – 8:30 | Demo Luồng 3: KTV Xử lý & Niêm phong Mật mã HMAC-SHA256
* **Thao tác:** Đăng nhập `technician@haui.vn` / `tech123`.
* **Điểm nhấn thuyết minh:**
  1. KTV nhận vé $\rightarrow$ Chuyển sang `in_progress` $\rightarrow$ Thêm ghi chú nội bộ bảo mật.
  2. Bấm **Giải quyết (Resolve)**.
  3. Mở **Biên bản Nghiệm thu (Work Order)**:
     > *"Đây là điểm đột phá của FixFlow: Biên bản nghiệm thu được niêm phong bằng **chữ ký mật mã học HMAC-SHA256**, sinh mã QR động. Mời Thầy/Cô dùng điện thoại cá nhân quét ngay mã QR trên màn hình!"*
  4. Trình duyệt điện thoại mở ra trang `/verify/...` hiển thị: Trạng thái biên bản hợp lệ, mã con dấu, tên KTV đã che theo Nghị định 13 (`Hoàng M. T.`).
  5. Bấm nút **In biên bản (A4)** $\rightarrow$ Màn hình in tự động căn chỉnh khổ giấy A4 dọc chuẩn hành chính, sẵn sàng lưu PDF.

### ⏱ Phút 8:30 – 10:00 | Tổng kết Chất lượng & Giấy phép Mã nguồn mở 100%
* **Lời nói:**
  > *"Để đảm bảo tính nghiêm túc tuyệt đối của phần mềm nguồn mở:*
  > *- **247/247 tệp mã nguồn (100%)** mang tiêu đề bản quyền Apache-2.0 chuẩn SPDX.*
  > *- **581 bài kiểm thử tự động (339 tests frontend + 242 tests backend)** đều PASSED 100%.*
  > *- Tự động hóa kiểm tra bí mật (Pre-commit hook) chống rò rỉ secret.*
  > *- Hệ thống hiện đang online công khai tại tên miền `fixflow.filebridge.click`.*
  > *Chúng em xin trân trọng cảm ơn và sẵn sàng nhận câu hỏi phản biện từ Hội đồng!"*

---

## PHẦN 5: BỘ CÂU HỎI VÀ ĐÁP ÁN "HẠ GỤC" HỘI ĐỒNG GIÁM KHẢO (Q&A)

### Câu 1: "Lõi Open-Core nằm ở đâu? Tại sao gọi là Headless?"
* **Trả lời chuẩn:**
  > *"Thưa Thầy/Cô, toàn bộ Tầng 1 của FixFlow là Open-Core Headless, định nghĩa tại file `docker-compose.core.yml`. Tầng này chạy ngầm 100% không giao diện, cung cấp 5 năng lực nền tảng: Xác thực Keycloak SSO (OIDC), Cổng API Gateway Nginx, CSDL PostgreSQL, Kho đối tượng MinIO S3 và Động cơ luồng n8n.
  > Để chứng minh Lõi độc lập, chỉ cần chạy lệnh `make demo-core`: Tầng 1 khởi động và sẵn sàng phục vụ API mà không cần bất kỳ container giao diện Tầng 3 nào."*

### Câu 2: "Điểm nào thể hiện 4 trục H-P-D-I thay vì là phần mềm CRUD thông thường?"
* **Trả lời chuẩn:**
  > *"Thưa Thầy/Cô, FixFlow không phải ứng dụng CRUD bảng biểu đơn thuần mà triển khai đầy đủ chuỗi giá trị H-P-D-I:
  > - **[H] Human:** Phân quyền 4 vai trò qua Keycloak SSO. Giao diện công thái học đạt chuẩn tương phản màu sắc WCAG 2.2 AA (>= 4.5:1), hỗ trợ Dark/Light mode chống lóa ngoài trời.
  > - **[P] Process:** Động cơ máy trạng thái FSM 7 bước, kiểm soát vòng đời vé, đồng bộ sự kiện qua Transactional Outbox Pattern & Hàng đợi thư chết (DLQ) chống mất dữ liệu khi mất kết nối.
  > - **[D] Data:** Mô hình dữ liệu phân tầng Nóng - Lạnh; lưu trữ ảnh hiện trường trên MinIO S3; sổ nhật ký kiểm toán bất biến bằng chuỗi băm Merkle Hash-Chain.
  > - **[I] Intelligence:** Bộ 4 tác tử AI thực dụng: Phân loại tự động 99%, Gợi ý KTV đa tiêu chí (XAI), Cẩm nang tri thức TF-IDF và Bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP."*

### Câu 3: "AI trong này hoạt động thế nào? Có bịa (hallucinate) không? Máy chấm thi không có mạng hoặc không có GPU thì AI có chạy được không?"
* **Trả lời chuẩn:**
  > *"Thưa Thầy/Cô, AI của FixFlow được thiết kế theo triết lý 'AI Thực dụng - Pragmatic AI':
  > 1. **Chống ảo giác 100%:** Cẩm nang kỹ thuật dùng mô hình không gian vector TF-IDF trích xuất chính xác các bài viết đã được chuyên gia HaUI phê duyệt, không sinh từ ngẫu nhiên.
  > 2. **Chạy hoàn toàn trên CPU:** Mô hình được tối ưu siêu nhẹ, không cần GPU rời.
  > 3. **Chịu lỗi tuyệt đối (Circuit Breaker Pattern):** Nếu AI Service phản hồi chậm quá 2 giây hoặc mất kết nối, mạch tự động ngắt và chuyển sang bộ phân loại Heuristic Regex bản địa trong **< 2ms**, người dùng không bao giờ cảm nhận được sự gián đoạn."*

### Câu 4: "Biên bản nghiệm thu sửa chữa hiện trường làm sao biết không bị sửa lén ngày giờ hoặc mạo danh?"
* **Trả lời chuẩn:**
  > *"Thưa Thầy/Cô, FixFlow áp dụng Con dấu Niêm phong Mật mã học (HMAC-SHA256 Seal):
  > - Khi vé đóng, toàn bộ dữ liệu gồm: Mã vé, Ngày tạo, Ngày hoàn tất, Đạt SLA, Tên KTV, ID khách hàng được chuẩn hóa và ký bằng mã khóa bí mật HMAC-SHA256, sinh ra một Seal Code 16 ký tự.
  > - Bất kỳ sự can thiệp nào vào database (ví dụ sửa ngày hoàn tất để lách SLA) đều làm sai lệch chuỗi băm.
  > - Người dùng chỉ cần quét mã QR trên biên bản để vào Cổng xác thực công khai `/verify/:ticketRef`. Hệ thống sẽ tính lại mã băm và báo ngay nếu biên bản bị làm giả."*

### Câu 5: "Khi khách hàng tải tệp ảnh hoặc file đính kèm lên, hệ thống phòng chống mã độc thế nào? Các bạn có cài ClamAV không?"
* **Trả lời chuẩn:**
  > *"Thưa Thầy/Cô, chúng em đã nghiên cứu rất kỹ: ClamAV tiêu tốn hơn 1.2 GB RAM và khởi động mất vài phút, rất nặng nề cho hệ thống máy chủ biên.
  > Thay vào đó, FixFlow xây dựng module **File Content Guard nhị phân siêu nhẹ (0 MB RAM, < 1ms)**:
  > - Kiểm tra Byte nhận dạng (Magic Bytes): Tệp đổi đuôi giả mạo (ví dụ đổi `.exe` thành `.png`) bị chặn ngay ở tầng nhị phân.
  > - Chống Zip Bomb: Kiểm tra hệ số nén và kích thước giải nén an toàn.
  > - Quét mã độc nhúng: Chặn macro độc hại trong Word/Excel (`vbaProject.bin`), chặn mã JavaScript nhúng trong PDF (`/JavaScript`, `/Launch`).
  > - Tính toán mã băm SHA-256 lưu vào sổ kiểm toán dữ liệu."*

### Câu 6: "Các bạn xử lý bài toán bảo vệ dữ liệu cá nhân (Nghị định 13/2023/NĐ-CP) như thế nào?"
* **Trả lời chuẩn:**
  > *"Thưa Thầy/Cô, FixFlow tuân thủ nghiêm ngặt Nghị định 13/2023/NĐ-CP:
  > 1. Bộ lọc PII tự động phát hiện và che giấu số Căn cước công dân (12 số), số điện thoại Việt Nam (+84 / 09x...), email cá nhân trước khi lưu trữ hoặc chuyển qua module AI.
  > 2. Nhận diện tên riêng tiếng Việt theo ngữ cảnh xưng hô ('anh Tuấn', 'chị Lan' -> 'anh [TÊN_ĐÃ_CHE]').
  > 3. Trên cổng xác thực công khai và biên bản bàn giao, tên KTV được che dạng chuẩn: `Hoàng Minh Tuấn` $\rightarrow$ `Hoàng M. T.` để bảo vệ thông tin chuyên gia."*

### Câu 7: "Nếu cơ sở dữ liệu gặp sự cố, hệ thống có giải pháp Backup & Restore thế nào?"
* **Trả lời chuẩn:**
  > *"Thưa Thầy/Cô, FixFlow trang bị bộ công cụ sao lưu và khôi phục tự động:
  > - Lệnh `make backup` tự động kết xuất dữ liệu PostgreSQL, đóng gói tệp đính kèm và tạo tệp `manifest.json` ghi nhận mã băm SHA-256 của từng file.
  > - Khi chạy `make restore`, hệ thống tự động kiểm tra tính toàn vẹn của mã băm trước khi khôi phục, ngăn chặn việc nạp bản sao lưu đã bị sửa đổi trái phép. Hệ thống tự động duy trì chính sách giữ lại 7 bản sao lưu gần nhất."*

---

## PHẦN 6: BẢNG LỆNH LIVE DEMO 1 CHẠM (TERMINAL CHEAT SHEET)

Khi đứng trước Hội đồng, nếu Giám khảo muốn xem bằng chứng kỹ thuật, bạn chỉ cần mở terminal gõ các lệnh Make sau:

| Lệnh | Ý nghĩa chứng minh cho Giám khảo |
|---|---|
| `make demo-core` | Khởi chạy riêng Tầng 1 Open-Core (chứng minh Lõi độc lập không cần App) |
| `make demo-ai` | Chạy benchmark AI Classifier & Circuit Breaker tự ngắt < 2ms |
| `make demo-recommender` | Chạy AI Recommender gợi ý KTV với dữ liệu thật từ CSDL |
| `make demo-kb` | Tra cứu Cẩm nang Kỹ thuật Knowledge Base bằng giải thuật TF-IDF |
| `make demo-pii` | Kiểm tra bộ lọc che giấu thông tin cá nhân PII (Nghị định 13/2023/NĐ-CP) |
| `make demo-it-ot` | Giả lập cảm biến IoT quá nhiệt phòng Lab 402 tự động bắn vé khẩn cấp |
| `make demo-nong-lanh` | Đóng gói vé nén WORM vào kho lạnh MinIO S3 |
| `make demo-audit` | Kiểm toán chuỗi băm Merkle Hash-Chain phát hiện sửa lén dữ liệu |
| `make eval-impact` | Chạy đo lường trước/sau: Giảm 89.6% thời gian tiếp nhận, 79.2% trễ hạn SLA |
| `make test` | Chạy toàn bộ 581 bài kiểm thử tự động đạt 100% Passed |
| `make license-check` | Quét kiểm toán 100% tệp mã nguồn đạt chuẩn bản quyền Apache-2.0 SPDX |
