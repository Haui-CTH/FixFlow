# BỘ CÂU HỎI & TRẢ LỜI PHẢN BIỆN HỘI ĐỒNG GIÁM KHẢO (OFFICIAL COUNCIL Q&A)
<!-- SPDX-License-Identifier: Apache-2.0 -->

> **Dự án:** FixFlow — Nền tảng Quản lý Dịch vụ Kỹ thuật Thực địa (DX-FSM) trên Lõi mở DX-OS  
> **Đơn vị:** Đội thi HaUI — Đại học Công nghiệp Hà Nội  
> **Kỳ thi:** Olympic Tin học Sinh viên Việt Nam 2026 — Khối Phần mềm Nguồn mở (OLP PMNM 2026)  
> **Chủ đề:** DX-OS Open-Core (VFOSSA)  
> **Quy cách bảo vệ:** 10 phút thuyết trình & Demo, 5 phút trả lời chất vấn phản biện của Hội đồng Giám khảo.

---

## MỤC LỤC 10 CÂU HỎI ĐỊNH HƯỚNG CHÍNH THỨC

1. [Open-Core của đội nằm ở đâu? Thành phần nào chạy headless và ứng dụng nào sử dụng dịch vụ đó?](#câu-1-open-core-của-đội-nằm-ở-đâu-thành-phần-nào-chạy-headless-và-ứng-dụng-nào-sử-dụng-dịch-vụ-đó)
2. [Tại sao đội chọn kiến trúc và stack này? Thành phần nào là nguồn mở và giấy phép gì?](#câu-2-tại-sao-đội-chọn-kiến-trúc-và-stack-này-thành-phần-nào-là-nguồn-mở-và-giấy-phép-gì)
3. [Nếu thay đổi ứng dụng nghiệp vụ, Open-Core có phải thay đổi theo không? Vì sao?](#câu-3-nếu-thay-đổi-ứng-dụng-nghiệp-vụ-open-core-có-phải-thay-đổi-theo-không-vì-sao)
4. [Identity/SSO, API Gateway, Data và Workflow được cung cấp như những dịch vụ dùng chung thế nào?](#câu-4-identitysso-api-gateway-data-và-workflow-được-cung-cấp-như-những-dịch-vụ-dùng-chung-thế-nào)
5. [Điểm nào thể hiện H-P-D-I thay vì chỉ là một dashboard CRUD?](#câu-5-điểm-nào-thể-hiện-h-p-d-i-thay-vì-chỉ-là-một-dashboard-crud)
6. [AI/ML được dùng ở đâu? Dữ liệu đầu vào, mô hình, đánh giá và giới hạn của kết quả là gì?](#câu-6-aiml-được-dùng-ở-đâu-dữ-liệu-đầu-vào-mô-hình-đánh-giá-và-giới-hạn-của-kết-quả-là-gì)
7. [Nếu một nguồn dữ liệu/API ngừng hoạt động, hệ thống xử lý thế nào?](#câu-7-nếu-một-nguồn-dữ-liệuapi-ngừng-hoạt-động-hệ-thống-xử-lý-thế-nào)
8. [Đội có thể build toàn bộ hệ thống từ source trên một máy mới không?](#câu-8-đội-có-thể-build-toàn-bộ-hệ-thống-từ-source-trên-một-máy-mới-không)
9. [Nếu tăng từ 100 lên 100.000 người dùng, kiến trúc sẽ thay đổi thế nào?](#câu-9-nếu-tăng-từ-100-lên-100000-người-dùng-kiến-trúc-sẽ-thay-đổi-thế-nào)
10. [Nếu cộng đồng muốn đóng góp một module mới, quy trình contribution của dự án là gì?](#câu-10-nếu-cộng-đồng-muốn-đóng-góp-một-module-mới-quy-trình-contribution-của-dự-án-là-gì)
11. [Phụ lục: Giám sát Observability & Kiểm toán Mật mã Chuỗi băm Merkle](#phụ-lục-quan-sát-hệ-thống-observability--kiểm-toán-mật-mã-merkle)

---

### CÂU 1: Open-Core của đội nằm ở đâu? Thành phần nào chạy headless và ứng dụng nào sử dụng dịch vụ đó?

#### 1. Vị trí Open-Core trong mã nguồn:
Toàn bộ Tầng 1 (Open-Core) được cô lập độc lập tại thư mục [`core/`](../core/) và có tệp điều phối riêng [`docker-compose.core.yml`](../docker-compose.core.yml). Tầng này hoàn toàn độc lập với mã nguồn nghiệp vụ của ứng dụng bảo trì.

#### 2. Các thành phần chạy Headless (100% không giao diện, cung cấp dịch vụ PaaS qua API):
1. **Định danh & Phân quyền tập trung (Identity/SSO):** `keycloak` (Keycloak 24) chạy ngầm, cấp phát JWT Bearer Token theo chuẩn OpenID Connect (OIDC) với Authorization Code Flow + PKCE.
2. **Cổng giao tiếp biên (API Gateway):** `gateway` (Nginx 1.27 Alpine) lắng nghe tại Port 80, điều phối Same-Origin, loại bỏ phân mảnh cổng, gắn header truy vết `X-Request-Id`.
3. **Quản trị dữ liệu cấu trúc:** `postgres` (PostgreSQL 16 Alpine) chứa CSDL quan hệ với 6 bản migration phân tầng (`core/postgres/migrations/`).
4. **Quản trị dữ liệu phi cấu trúc (Object Storage):** `minio` (MinIO S3) cung cấp kho lưu trữ bucket S3 `fsm-attachments` cho ảnh hiện trường, tệp đính kèm và biên bản bàn giao.
5. **Động cơ luồng công việc (Workflow Engine):** `n8n` (n8n Workflow Automation) thực thi các kịch bản BPMN tự động hóa ngầm.
6. **Hub Truyền thông Thông báo:** `notification-service` kết hợp `mailhog` định tuyến email SMTP, SMS và Webhook.

#### 3. Ứng dụng nào sử dụng dịch vụ đó?
* **Tầng 2 (H-P-D-I Microservices):** `ticket-service` (8001), `ai-service` (8002) kết nối nội bộ vào PostgreSQL, MinIO S3, Keycloak để xác thực quyền hạn và truy vấn dữ liệu.
* **Tầng 3 (Giao diện Người dùng):** Ứng dụng Web SPA React 18 & PWA Mobile (`app/`) phục vụ 4 đối tượng người dùng: *Customer* (Khách hàng báo hỏng), *Technician* (Kỹ thuật viên hiện trường), *Manager* (Quản lý điều phối), *Admin* (Quản trị viên hệ thống). Mọi kết nối đều đi qua cổng Gateway duy nhất.

> 🛠 **Lệnh minh chứng Giám khảo:** Chạy `make demo-core`. Tầng 1 sẽ khởi động độc lập hoàn toàn, sẵn sàng phục vụ API mà không cần bất kỳ container giao diện Tầng 3 nào.

---

### CÂU 2: Tại sao đội chọn kiến trúc và stack này? Thành phần nào là nguồn mở và giấy phép gì?

#### 1. Lý do lựa chọn kiến trúc & Stack công nghệ:
* **Chuẩn hóa triết lý DX-OS (VFOSSA):** Kiến trúc phân tầng rõ rệt: *Tầng 1 (PaaS Lõi mở)* $\rightarrow$ *Tầng 2 (H-P-D-I Microservices)* $\rightarrow$ *Tầng 3 (Client App)* giúp hệ thống module hóa cao độ, dễ bảo trì và tái sử dụng.
* **Tối ưu tài nguyên cực đại (Lightweight Open-Core):**
  * Thay vì chọn các công nghệ cồng kềnh ngốn RAM (như Java Spring Boot, Elasticsearch hay ClamAV ngốn 4–6 GB RAM), FixFlow chọn **Python FastAPI + React 18 + Alpine Nginx + Postgres 16**.
  * Toàn bộ 10 containers chỉ tiêu thụ **~1.8 GB RAM**, thời gian khởi động chỉ **15 giây**, chạy mượt mà ngay trên laptop sinh viên và máy chủ cá nhân cấu hình khiêm tốn.
* **Kiến trúc Single-Origin qua Nginx Gateway:** Gom mọi dịch vụ (Web, Auth, API, S3) về cổng chuẩn **80 / 443**, giải quyết triệt để lỗi CORS và xung đột Web Crypto API của Keycloak khi chạy qua mạng nội bộ hoặc domain Internet.

#### 2. Thành phần nguồn mở và giấy phép bản quyền (100% OSI-Approved):
* **247 tệp mã nguồn tự phát triển:** Đăng ký bản quyền mở **Apache License 2.0** ([`LICENSE`](../LICENSE)), mang tiêu đề SPDX header chuẩn mực: `// SPDX-License-Identifier: Apache-2.0` hoặc `# SPDX-License-Identifier: Apache-2.0`.
* **Thành phần phần mềm thượng nguồn (Upstream):** Sử dụng các container image chính thức dạng nguyên bản, tuyệt đối không can thiệp sửa đổi mã nguồn:
  * Keycloak: **Apache-2.0**
  * Nginx: **BSD-2-Clause**
  * PostgreSQL: **PostgreSQL License** (tương thích MIT)
  * MinIO: **GNU AGPLv3** (sử dụng container đóng gói qua giao diện mạng S3)
  * FastAPI, Uvicorn, React 18, Vite, TanStack Query: **MIT License**
  * MailHog: **MIT License**
* **Cam kết:** **0% mã nguồn dính giấy phép thương mại hạn chế (Non-OSI)** như SSPL (MongoDB/Elastic), BUSL (HashiCorp Vault). Toàn bộ danh mục phụ thuộc công khai tại [`DEPENDENCIES.md`](../DEPENDENCIES.md).

> 🛠 **Lệnh minh chứng Giám khảo:** Chạy `make license-check`. Bộ kiểm toán quét 100% tệp tin đạt chuẩn Apache-2.0 SPDX.

---

### CÂU 3: Nếu thay đổi ứng dụng nghiệp vụ, Open-Core có phải thay đổi theo không? Vì sao?

#### Câu trả lời: HOÀN TOÀN KHÔNG PHẢI THAY ĐỔI.

#### Phân tích kỹ thuật:
1. **Thiết kế theo nguyên lý Tách biệt mối quan tâm (Separation of Concerns):**
   * Lõi Tầng 1 được thiết kế trung lập và hướng hợp đồng (Contract-first API).
   * Trong cấu trúc CSDL và cấu hình của Tầng 1, hoàn toàn **không chứa logic nghiệp vụ đặc thù** của bài toán quản lý sự cố FSM (không có bất kỳ bảng nào quy định "thiết bị máy in", "phân công KTV").
2. **Các năng lực Tầng 1 cung cấp là năng lực nền tảng phổ quát:**
   * Cấp phát và thẩm định danh tính người dùng (JWT / OIDC).
   * Phân quyền truy cập tài nguyên (RBAC).
   * Định tuyến và cân bằng tải ngược (Reverse Proxy).
   * Lưu trữ khối dữ liệu quan hệ (ACID RDBMS) và đối tượng phi cấu trúc (S3 API).
   * Kích hoạt luồng sự kiện (Outbox / Webhook) và gửi thông báo đa kênh.
3. **Kịch bản chuyển đổi nghiệp vụ thực tế:**
   * Giả sử Nhà trường muốn xây dựng hệ thống **Quản lý Ký túc xá** hoặc **Số hóa Nông nghiệp thực nghiệm**:
     * Đội phát triển chỉ cần khai báo thêm một OIDC Client ID trên Keycloak (`dormitory-client`).
     * Tạo một schema hoặc database mới trong PostgreSQL (`dormitory_db`).
     * Viết các microservices nghiệp vụ mới ở Tầng 2 và giao diện ở Tầng 3.
     * **Toàn bộ Lõi Tầng 1 giữ nguyên 100%, không cần viết lại hay sửa đổi một dòng code nào.**

---

### CÂU 4: Identity/SSO, API Gateway, Data và Workflow được cung cấp như những dịch vụ dùng chung thế nào?

Hệ thống đóng gói 4 dịch vụ cốt lõi thành các giao diện lập trình dùng chung (Shared Platform Services):

```
                     ┌─────────────────────────────────────────┐
                     │          ỨNG DỤNG NGHIỆP VỤ             │
                     │  (FixFlow FSM, Ký túc xá, Kho lab...)   │
                     └────────────────────┬────────────────────┘
                                          │
       ┌──────────────────┬───────────────┴───────────────┬──────────────────┐
       ▼                  ▼                               ▼                  ▼
┌──────────────┐   ┌──────────────┐                ┌──────────────┐   ┌──────────────┐
│ IDENTITY/SSO │   │ API GATEWAY  │                │     DATA     │   │   WORKFLOW   │
│ Keycloak 24  │   │   Nginx 80   │                │ Postgres/S3  │   │     n8n      │
│  (OIDC PKCE) │   │ (Reverse Px) │                │ (Connection) │   │  (Webhooks)  │
└──────────────┘   └──────────────┘                └──────────────┘   └──────────────┘
```

1. **Identity/SSO (Keycloak 24):**
   * Hoạt động như một Identity Provider (IdP) độc lập qua giao thức OpenID Connect (OIDC).
   * Mọi ứng dụng thành phần chỉ cần trỏ về endpoint `/.well-known/openid-configuration` để xác thực chữ ký JWT, kiểm tra phạm vi (scope) và phân quyền 4 vai trò tập trung.
2. **API Gateway (Nginx 1.27 Alpine):**
   * Là điểm tiếp nhận duy nhất (Single Entrypoint) trên cổng 80:
     * `/api/v1/tickets` $\rightarrow$ `ticket-service:8001`
     * `/api/v1/ai` $\rightarrow$ `ai-service:8002`
     * `/realms/dx-fsm` $\rightarrow$ `keycloak:8080`
     * `/` $\rightarrow$ `app:3000` (React Web SPA)
   * Đảm nhiệm kiểm soát CORS tập trung, rate limiting chống brute-force (15 req/s cho cổng xác thực công khai), và phân phối mã `X-Request-Id` phục vụ truy vết lỗi đầu-cuối.
3. **Data Service (PostgreSQL 16 + MinIO S3):**
   * *Dữ liệu quan hệ:* PostgreSQL cung cấp cơ chế connection pooling, hỗ trợ phân chia schema độc lập và bảng sự kiện Transactional Outbox.
   * *Dữ liệu đối tượng:* MinIO cung cấp chuẩn S3 RESTful API cho phép bất kỳ microservice nào cũng có thể upload, download và tạo link ký tạm thời (Presigned URL) cho tệp đính kèm.
4. **Workflow Engine (n8n):**
   * Động cơ tự động hóa BPMN độc lập, nhận bản tin qua Webhook khi vé chuyển trạng thái và tự động thực thi các hành động phối hợp liên hệ thống (gửi email, đồng bộ lịch công tác, cảnh báo Slack/Zalo).

---

### CÂU 5: Điểm nào thể hiện H-P-D-I thay vì chỉ là một dashboard CRUD?

FixFlow hiện thực hóa trọn vẹn chuỗi giá trị 4 không gian số, vượt xa một phần mềm CRUD bảng biểu sinh viên:

| Trục H-P-D-I | Sự khác biệt vượt bậc so với Dashboard CRUD | Hiện thực hóa trong mã nguồn FixFlow |
|:---:|---|---|
| **[H] Human**<br>*(Con người)* | **Không chỉ là bảng quản lý User tĩnh:**<br>- Định danh SSO tập trung, phân quyền RBAC 4 vai trò nghiêm ngặt.<br>- Tối ưu công thái học hiện trường: Hỗ trợ PWA cài đặt trực tiếp lên màn hình điện thoại KTV; Dark/Light mode chống lóa khi thao tác ngoài trời.<br>- **Bảo vệ quyền riêng tư theo Nghị định 13/2023/NĐ-CP**: Tự động che CCCD, SĐT, Email và tên KTV (`Hoàng M. T.`) trên cổng tra cứu.<br>- Đạt chuẩn tương phản màu sắc **WCAG 2.2 AA (>= 4.5:1)**. | [`app/src/test/contrast.test.ts`](../app/src/test/contrast.test.ts)<br>[`app/public/manifest.json`](../app/public/manifest.json)<br>[`services/ai-service/app/services/pii.py`](../services/ai-service/app/services/pii.py) |
| **[P] Process**<br>*(Quy trình)* | **Không chỉ là ô dropdown đổi trạng thái:**<br>- Động cơ máy trạng thái hữu hạn (**FSM 7 bước**) quản lý vòng đời vé: `open` $\rightarrow$ `assigned` $\rightarrow$ `in_progress` $\rightarrow$ `pending_customer` $\rightarrow$ `resolved` $\rightarrow$ `closed`.<br>- **Transactional Outbox Pattern & Hàng đợi thư chết (DLQ)**: Đảm bảo giao dịch vé và thông báo liên dịch vụ luôn toàn vẹn, cam kết không mất mát sự kiện khi có sự cố mạng.<br>- Đồng hồ tính toán và cảnh báo vi phạm cam kết thời gian SLA theo thời gian thực. | [`services/ticket-service/app/services/ticket_service.py`](../services/ticket-service/app/services/ticket_service.py)<br>[`core/postgres/migrations/003_outbox_dlq.sql`](../core/postgres/migrations/003_outbox_dlq.sql) |
| **[D] Data**<br>*(Dữ liệu)* | **Không chỉ là câu lệnh SQL SELECT / INSERT:**<br>- Phân tách dữ liệu **Nóng (Postgres OLTP)** và **Lạnh (Kho nén WORM trên MinIO S3)**.<br>- **Sổ kiểm toán chuỗi băm Merkle Hash-Chain**: Khóa chặt lịch sử thay đổi vé; bất kỳ hành vi sửa lén dữ liệu trong DB đều làm gãy chuỗi băm ngay lập tức.<br>- **Niêm phong mật mã học HMAC-SHA256**: Con dấu số bảo chứng tính pháp lý trên biên bản nghiệm thu, kiểm chứng công khai bằng mã QR.<br>- Cơ chế sao lưu/khôi phục tự động đối soát mã băm SHA-256 (`make backup`). | [`services/ticket-service/app/services/seal.py`](../services/ticket-service/app/services/seal.py)<br>[`services/ticket-service/app/services/audit_service.py`](../services/ticket-service/app/services/audit_service.py)<br>[`scripts/backup.py`](../scripts/backup.py) |
| **[I] Intelligence**<br>*(Trí tuệ)* | **Không phải là dữ liệu cứng hay câu lệnh if/else:**<br>- **Bộ 4 tác tử AI thực dụng**: (1) Tự động phân loại danh mục độ chính xác **99.00%**; (2) Gợi ý KTV đa tiêu chí kèm phân rã điểm số minh bạch (*Explainable AI*); (3) Cẩm nang tri thức TF-IDF Semantic Query Expansion; (4) Bộ lọc che giấu PII ngữ cảnh xưng hô tiếng Việt.<br>- **Circuit Breaker Pattern**: Tự ngắt fallback sang Heuristic Regex trong **< 2ms** khi AI quá tải. | [`services/ai-service/app/services/`](../services/ai-service/app/services/)<br>[`app/src/lib/kb-search.ts`](../app/src/lib/kb-search.ts)<br>[`app/src/lib/recommender.ts`](../app/src/lib/recommender.ts) |

---

### CÂU 6: AI/ML được dùng ở đâu? Dữ liệu đầu vào, mô hình, đánh giá và giới hạn của kết quả là gì?

#### 1. Các vị trí ứng dụng AI/ML trong hệ thống:
1. **Tiếp nhận sự cố (Intake Classifier):** Tự động phân tích ngữ nghĩa tiêu đề và mô tả để gán nhãn 7 danh mục sự cố (`hardware`, `software`, `network`, `electrical`, `access_control`, `request`, `other`) và 4 cấp độ ưu tiên (`low`, `medium`, `high`, `critical`).
2. **Cẩm nang Tri thức Kỹ thuật (Knowledge Base Recommender):** Tự động truy hồi giải pháp kỹ thuật từ ngân hàng tri thức HaUI ngay khi khách hàng đang nhập văn bản.
3. **Phân công Kỹ thuật viên Thông minh (Smart Dispatching):** Gợi ý kỹ thuật viên tối ưu nhất cho người quản lý điều phối dựa trên ma trận năng lực thực tế.
4. **Bảo vệ Dữ liệu Cá nhân (PII Guard):** Tự động nhận diện và làm mờ các trường dữ liệu nhạy cảm theo Nghị định 13/2023/NĐ-CP.

#### 2. Dữ liệu đầu vào & Mô hình giải thuật:
* **Dữ liệu đầu vào:** Văn bản tiếng Việt có dấu/không dấu (tiêu đề, mô tả sự cố), vị trí hiện trường (tòa nhà, phòng ban), hồ sơ chuyên môn và lịch sử tải việc của 8 KTV mẫu HaUI.
* **Mô hình giải thuật:**
  * *Phân loại & Cẩm nang:* Mô hình không gian vector **TF-IDF (Term Frequency-Inverse Document Frequency) kết hợp Cosine Similarity**, tiền xử lý ngôn ngữ tiếng Việt (Stopwords loại bỏ từ dừng kỹ thuật, N-gram phân tích cụm từ ghép).
  * *Phân công KTV:* Thuật toán tối ưu hóa đa mục tiêu (*Multi-criteria Decision Analysis*):
    $$\text{Score} = 0.4 \times \text{Expertise} + 0.3 \times \text{Workload\_Balance} + 0.3 \times \text{Historical\_Rating}$$
  * *Mở rộng Cục bộ:* Hỗ trợ kết nối mô hình ngôn ngữ lớn Ollama LLM (Llama 3.2 3B) qua biến môi trường `OLLAMA_BASE_URL`.

#### 3. Đánh giá định lượng (Benchmark):
Chạy lệnh `make eval-ai` để trích xuất số liệu đánh giá khách quan:
* Phân loại danh mục sự cố: Độ chính xác đạt **99.00%**, chỉ số Macro F1-score đạt **99.6%**.
* Thời gian suy diễn phân loại: Trung bình **0.18ms/ticket** trên CPU thông thường.
* Tốc độ truy hồi cẩm nang Knowledge Base: Trung bình **7.7ms**.

#### 4. Giới hạn của kết quả & Biện pháp kiểm soát:
* **Giới hạn:** Với các từ lóng công nghệ mới xuất hiện hoặc lỗi thiết bị có thuật ngữ viết tắt quá đặc thù, độ tin cậy phân loại có thể giảm xuống dưới 80%.
* **Kiểm soát rủi ro (Human-in-the-Loop & XAI):**
  * Hệ thống **không bao giờ tự ý cưỡng ép quyết định**: Khách hàng và Quản trị viên luôn có quyền chỉnh sửa lại danh mục trước khi lưu vé.
  * Mọi gợi ý phân công KTV đều minh bạch điểm số thành phần (Explainable AI), giúp người điều phối hiểu rõ lý do đề xuất.
  * Cẩm nang KB chỉ trích xuất từ tài liệu đã qua thẩm định của chuyên gia HaUI, **tuyệt đối không bị ảo giác (zero hallucination)**.

---

### CÂU 7: Nếu một nguồn dữ liệu/API ngừng hoạt động, hệ thống xử lý thế nào?

FixFlow được thiết kế theo nguyên lý **Chịu lỗi Đa tầng (Graceful Degradation & Resilience)** — đảm bảo hệ thống không bao giờ bị tê liệt toàn bộ:

1. **Khi AI Service hoặc mô hình LLM bị sập/quá tải:**
   * **Cơ chế:** Trang bị **Circuit Breaker Pattern** với ngưỡng timeout 2.0 giây.
   * **Xử lý:** Mạch tự động ngắt kết nối và chuyển sang bộ phân loại Heuristic Regex bản địa trong **< 2ms**. Người dùng tại hiện trường tiếp tục tạo vé bình thường mà không hề thấy thông báo lỗi.
2. **Khi MinIO S3 Object Storage ngừng hoạt động:**
   * **Cơ chế:** Lớp trừu tượng lưu trữ `StorageService` tích hợp cơ chế tự động thăm dò sức khỏe S3 (S3 Health Probe).
   * **Xử lý:** Khi MinIO ngắt kết nối, hệ thống tự động chuyển tiếp liền mạch sang lưu tệp vào đĩa cứng cục bộ container (`/data/attachments/`), ghi log cảnh báo và trả về mã thành công HTTP 200 cho người dùng. Khi MinIO online trở lại, dữ liệu được kích hoạt đồng bộ bù.
3. **Khi Notification Service hoặc máy chủ Mail/SMS bị mất kết nối:**
   * **Cơ chế:** Áp dụng **Transactional Outbox Pattern**.
   * **Xử lý:** Khi KTV nhận vé hoặc đóng vé, bản tin thông báo được ghi vào bảng `outbox_events` trong PostgreSQL cùng một giao dịch ACID với vé. Worker gửi thông báo chạy độc lập: nếu mail server sập, sự kiện vẫn nằm an toàn trong CSDL và tự động gửi lại (At-least-once Delivery) ngay khi dịch vụ mail hồi phục.
4. **Khi Cơ sở dữ liệu PostgreSQL gặp sự cố thảm họa:**
   * **Xử lý:** Sử dụng bộ kịch bản phục hồi thảm họa `make restore` (hoặc `python scripts/restore.py`). Hệ thống tự động kiểm tra đối soát mã băm SHA-256 từ tệp `manifest.json` trước khi nạp dữ liệu, ngăn chặn nguy cơ nạp bản backup bị sửa đổi trái phép.

> 🛠 **Lệnh minh chứng Giám khảo:** Chạy `make demo-resilience`. Hệ thống giả lập ngắt MinIO S3 nhưng thao tác lưu ảnh hiện trường vẫn hoàn tất 100% qua Local Fallback.

---

### CÂU 8: Đội có thể build toàn bộ hệ thống từ source trên một máy mới không?

#### Câu trả lời: HOÀN TOÀN ĐƯỢC VÀ CHỈ CẦN 1 LỆNH DUY NHẤT.

#### Quy trình tái lập 100% tự động (Reproducibility):
Trên một máy tính mới hoàn toàn (chỉ cần cài sẵn Docker Desktop / Docker Engine và Git):

```bash
# 1. Tải toàn bộ mã nguồn
git clone https://github.com/truong-newbie/PMNM_2026_DX_FSM.git
cd PMNM_2026_DX_FSM

# 2. Khởi tạo biến môi trường an toàn từ bản mẫu
make setup-env

# 3. Build từ mã nguồn và khởi chạy toàn bộ 10 container
make up
```

#### Các yếu tố bảo đảm không có phụ thuộc ẩn (Zero Hidden Dependencies):
1. **Container hóa độc lập:** Mọi microservice (FastAPI, React Vite, Nginx, Keycloak) đều có tệp `Dockerfile` đa tầng (multi-stage build) tiêu chuẩn, tự động kéo thư viện và biên dịch từ source.
2. **Tự động hóa di chuyển lược đồ (Automated Migration):**
   * PostgreSQL tự động chạy tuần tự 6 tệp migration trong `/docker-entrypoint-initdb.d/`: khởi tạo bảng, thiết lập Outbox, cấu hình hàng đợi DLQ, nạp danh mục và nạp dữ liệu mẫu thực tế.
3. **Dữ liệu thực nghiệm nạp sẵn:** Hệ thống tự động seed **77+ vé sự cố thực tế** tại các tòa nhà HaUI, 8 kỹ thuật viên mẫu, đầy đủ 4 tài khoản thử nghiệm tương ứng 4 vai trò.
4. **Kiểm tra sức khỏe tự động:** Ngay sau khi build, người dùng có thể chạy `python scripts/verify_online_deploy.py http://localhost` để quét tự động 7 bài test khép kín.

---

### CÂU 9: Nếu tăng từ 100 lên 100.000 người dùng, kiến trúc sẽ thay đổi thế nào?

Kiến trúc Microservices Stateless của FixFlow được thiết kế sẵn sàng cho việc mở rộng theo chiều ngang (Scale-Out) theo 4 nấc thang:

```
[100.000 Người dùng]
        │
        ▼ (HTTPS)
┌─────────────────────────────────────────────────────────────┐
│ CDN & DDoS EDGE (Cloudflare Anycast / AWS CloudFront)       │
│ - Lưu đệm 100% Static Web Assets (React JS/CSS)             │
├─────────────────────────────────────────────────────────────┤
│ LOAD BALANCER CÂN BẰNG TẢI (Nginx Cluster / AWS ALB)        │
├──────────────────────────────┬──────────────────────────────┤
│ LỚP DỊCH VỤ (Stateless)     │ LỚP DỊCH VỤ (Stateless)      │
│ ticket-service (10 pods)     │ ai-service (5 pods)          │
├──────────────────────────────┴──────────────────────────────┤
│ BỘ ĐỆM PHÂN TÁN: Redis Cluster (Session, Cache KB, Quota)   │
├─────────────────────────────────────────────────────────────┤
│ CSDL: PostgreSQL Master (Ghi) ──► 3 Read-Replicas (Đọc)     │
│ KHO TỆP: MinIO Distributed (Erasure Coding) / AWS S3        │
└─────────────────────────────────────────────────────────────┘
```

1. **Lớp Giao diện & Biên mạng (CDN & Static Edge):**
   * Tách gói build của React 18 SPA đẩy lên CDN (Cloudflare Edge / AWS S3).
   * 100.000 người dùng tải file tĩnh HTML/JS trực tiếp từ CDN, giảm tải 90% lưu lượng về máy chủ gốc với chi phí gần như bằng 0.
2. **Lớp Dịch vụ Nghiệp vụ (Stateless Microservices):**
   * Các container `ticket-service` và `ai-service` hoàn toàn **Stateless** (danh tính thẩm định qua chữ ký JWT Bearer, không lưu session bộ nhớ).
   * Dễ dàng nâng số lượng instances từ 1 lên 20–50 pods thông qua Kubernetes HPA (Horizontal Pod Autoscaler) hoặc Docker Swarm dựa trên ngưỡng CPU/RAM.
3. **Lớp Lưu trữ Đệm (Caching Layer):**
   * Triển khai cụm **Redis Cluster** làm bộ đệm trung gian: Cache các truy vấn đọc thường xuyên (Danh sách cẩm nang KB, danh mục sự cố, danh sách KTV), giảm 80% áp lực truy vấn trực tiếp vào CSDL.
4. **Lớp Cơ sở Dữ liệu & Lưu trữ Tệp:**
   * **PostgreSQL:** Chuyển sang mô hình **Read/Write Splitting**: 1 Node Master chuyên tiếp nhận giao dịch ghi vé; 3–5 Node Read Replicas (sao chép luồng dữ liệu thời gian thực) gánh toàn bộ truy vấn đọc báo cáo và Dashboard.
   * **MinIO S3:** Mở rộng từ MinIO Standalone (1 ổ đĩa) sang mô hình **Distributed MinIO** (cụm 4–16 ổ đĩa phân tán với thuật toán Erasure Coding chống mất mát dữ liệu) hoặc chuyển tiếp sang AWS S3 / Cloudflare R2 không giới hạn dung lượng.

---

### CÂU 10: Nếu cộng đồng muốn đóng góp một module mới, quy trình contribution của dự án là gì?

FixFlow đã thiết lập và công khai bộ quy chuẩn đóng góp mã nguồn mở quốc tế tại tệp [`CONTRIBUTING.md`](../CONTRIBUTING.md) và tài liệu mở rộng [`docs/them-ung-dung.md`](them-ung-dung.md):

```
Nhánh feature/xyz ──► Pre-commit Hook ──► Pull Request ──► Automated CI Test ──► Code Review ──► Merge develop
                     (Chống lộ Secret)                   (Bản quyền & 581 tests) (Maintainer)
```

1. **Chuẩn bị & Phân nhánh theo GitFlow:**
   * Nhà phát triển Fork repo và tạo nhánh tính năng mới từ `develop` theo quy ước: `feature/<tên-tính-năng>` hoặc `fix/<tên-lỗi>`.
   * Tuân thủ quy tắc kiến trúc H-P-D-I mô tả chi tiết tại tài liệu hướng dẫn cắm ứng dụng mới.
2. **Hàng rào Kiểm soát Chất lượng Tự động Cục bộ (Local Quality Gates):**
   * **Kiểm tra Bí mật:** Chạy pre-commit hook (`node scripts/check-secrets.cjs`) để phát hiện và ngăn chặn tuyệt đối việc commit mật khẩu, private key, token vào git history.
   * **Bản quyền Nguồn mở:** Mọi tệp mã nguồn mới bắt buộc phải có tiêu đề giấy phép Apache-2.0 SPDX chuẩn mực. Chạy `python scripts/license_check.py` đạt 100%.
   * **Độ bao phủ Kiểm thử:** Tính năng mới phải đi kèm bài kiểm thử tự động (Unit / Integration tests) và bảo đảm toàn bộ **581 bài test** hiện hữu đều Passed 100% (`make test`).
3. **Quy trình Mở Pull Request (PR):**
   * Mở PR hướng về nhánh `develop` theo đúng biểu mẫu [`PULL_REQUEST_TEMPLATE.md`](../.github/PULL_REQUEST_TEMPLATE.md).
   * Cung cấp minh chứng chạy kiểm thử, mô tả thay đổi lược đồ CSDL (nếu có migration mới).
4. **Đánh giá & Duyệt mã (Code Review & Governance):**
   * Ít nhất 01 thành viên Core Maintainer kiểm tra logic, đối soát chuẩn an toàn OWASP Top 10 trước khi phê duyệt và thực hiện *Squash and Merge*.
   * Lịch sử thay đổi được ghi nhận tự động vào [`CHANGELOG.md`](../CHANGELOG.md) theo chuẩn *Keep a Changelog*.

---

## PHỤ LỤC: QUAN SÁT HỆ THỐNG (OBSERVABILITY) & KIỂM TOÁN MẬT MÃ (MERKLE)

*(Dành cho các câu hỏi đào sâu kỹ thuật từ Giám khảo chuyên gia mạng & bảo mật)*

#### 1. Hệ thống giám sát, đo kiểm & truy vết sự cố (Observability & Tracing) được tổ chức thế nào?
* **Truy vết đầu-cuối (End-to-End Tracing):** Mọi request đi qua Nginx Gateway đều được cấp phát mã định danh `X-Request-Id`. Header này được lan truyền xuyên suốt qua FastAPI services, câu lệnh SQL Postgres và log MinIO S3, cho phép khoanh vùng nguyên nhân sự cố trong vài giây.
* **Cổng giám sát tập trung (`/monitor`):** Tích hợp sẵn dashboard nội bộ dành cho quản trị viên, theo dõi trạng thái sống còn của 10 containers, độ trễ phản hồi từng microservice, lưu lượng hàng đợi Outbox và số liệu kích hoạt của AI Circuit Breaker.

#### 2. Cơ chế Quản trị Dữ liệu (Nguyên lý iii DX-OS) chống chối bỏ trách nhiệm ra sao?
* **Chuỗi băm Merkle Hash-Chain:** Toàn bộ nhật ký chuyển trạng thái vé được xâu chuỗi băm mật mã: $\text{Hash}_n = \text{SHA256}(\text{Data}_n + \text{Hash}_{n-1})$.
* **Chống sửa lén CSDL:** Nếu một DBA dùng quyền root truy cập trực tiếp vào PostgreSQL để sửa giờ hoàn thành nhằm "chữa cháy" vi phạm SLA, toàn bộ các mắt xích hash phía sau sẽ bị phá vỡ. Chạy `make demo-audit` sẽ phát hiện đích danh dòng bản ghi bị can thiệp trái phép.
