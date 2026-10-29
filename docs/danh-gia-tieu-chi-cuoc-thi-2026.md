# BÁO CÁO ĐỐI SOÁT TIÊU CHÍ CUỘC THI PMNM 2026 & KẾ HOẠCH HOÀN THIỆN DỰ ÁN DX-FSM

> **Tài liệu tham chiếu:**
> 1. `De_thi_PMNM_HaUI_2026_BAN_CHINH_THUC.pdf` – Đề thi tuyển chọn vòng trường HaUI.
> 2. `Phieu_du_kien_danh_gia_Hoi_dong_PMNM_HaUI_2026.pdf` – Phiếu chấm điểm 100 điểm của Hội đồng giám khảo.
> 3. `Quick-guide-to-DXOS.pdf` – Giáo trình phương pháp luận DX-OS và mô hình H-P-D-I (VFOSSA).
> 4. `Thể lệ cuộc thi phần mềm nguồn mở - OLP 2026.pdf` – Quy chế chung OLP PMNM toàn quốc.

---

## MỤC LỤC
1. [Bản chất & Triết lý cốt lõi của đề thi](#1-bản-chất--triết-lý-cốt-lõi-của-đề-thi)
2. [Chi tiết thang điểm 100 & Các điều kiện loại trừ (PoF)](#2-chi-tiết-thang-điểm-100--các-điều-kiện-loại-trừ-pof)
3. [Đánh giá hiện trạng dự án DX-FSM](#3-đánh-giá-hiện-trạng-dự-án-dx-fsm)
   - [3.1. Những điểm đã làm rất tốt (Ưu điểm)](#31-những-điểm-đã-làm-rất-tốt-ưu-điểm)
   - [3.2. Những thiếu sót & rủi ro bị trừ điểm (Cần cải thiện)](#32-những-thiếu-sót--rủi-ro-bị-trừ-điểm-cần-cải-thiện)
4. [Bộ câu hỏi chất vấn định hướng của Hội đồng & Gợi ý trả lời](#4-bộ-câu-hỏi-chất-vấn-định-hướng-của-hội-đồng--gợi-ý-trả-lời)
5. [Kế hoạch hành động cụ thể (Action Plan)](#5-kế-hoạch-hành-động-cụ-thể-action-plan)

---

## 1. BẢN CHẤT & TRIẾT LÝ CỐT LÕI CỦA ĐỀ THI

### 1.1. Tinh thần bắt buộc: "Open-Core trước – Ứng dụng sau"
* **Không làm ứng dụng đơn lẻ:** Hội đồng không tìm kiếm một website quản lý độc lập hay một app CRUD thông thường có gắn thêm giao diện dashboard/AI.
* **Open-Core đóng vai trò PaaS:** Phải xây dựng **Tầng 1 (DX-OS Open-Core)** chạy ngầm (headless, không UI) cung cấp các dịch vụ nền tảng dùng chung cho toàn bộ tổ chức:
  1. *Identity / SSO:* Định danh tập trung, RBAC.
  2. *API Gateway:* Điểm truy cập duy nhất, kiểm soát định tuyến và phân quyền.
  3. *Data Engine:* Quản trị dữ liệu cấu trúc (CSDL quan hệ) và phi cấu trúc (Files/Objects).
  4. *Workflow Engine:* Động cơ quy trình, phê duyệt và quản lý vòng đời trạng thái.
* **Tính độc lập của Core:** Nếu thay đổi bài toán nghiệp vụ ở tầng trên (ví dụ từ quản lý bảo trì sang quản lý mượn phòng học), phần **Open-Core ở Tầng 1 không phải thay đổi**.

### 1.2. Chuỗi tiến hóa tuyến tính H-P-D-I
Theo giáo trình DX-OS, hệ thống chuyển giao quyền kiểm soát từ con người sang thuật toán qua 4 không gian năng lực số hóa:
* **[H] Human (Con người số):** Môi trường làm việc số khép kín, SSO tập trung, lưu trữ thông tin chuẩn hóa P.A.R.A, cổng thông tin nội bộ.
* **[P] Process (Quy trình số):** Tự động hóa luồng việc hướng sự kiện, áp dụng rào chắn kỹ thuật (**Poka-yoke**) để chặn lỗi ngay từ điểm chạm đầu vào, ghi nhận lịch sử audit log xuyên suốt.
* **[D] Data (Dữ liệu số):** Tạo nguồn cơ sở dữ liệu sự thật duy nhất (**Single Source of Truth**), dữ liệu phẳng có cấu trúc, dashboard thời gian thực đo lường chỉ số vận hành (SLA, tải công việc).
* **[I] Intelligence (Trí tuệ số):** Tác tử thông minh (Agentic AI), tự động phân tích dữ liệu [D] và bắt sự kiện từ [P] để ra quyết định tự hành; tuân thủ nguyên lý **Human-in-the-loop** (con người kiểm soát ngoại lệ).

---

## 2. CHI TIẾT THANG ĐIỂM 100 & CÁC ĐIỀU KIỆN LOẠI TRỪ (PoF)

### 2.1. Vòng kiểm tra điều kiện tiên quyết (Check Đạt / Chưa đạt trước khi chấm)
*Nếu vi phạm các điều kiện sau, Hội đồng có thể không chấm điểm hoặc xem xét loại đội thi:*
1. **Repository:** Công khai trên GitHub/GitLab, có web viewer, truy cập tự do từ Internet.
2. **Bản quyền:** Có giấy phép OSI-approved hợp lệ, có file `LICENSE` toàn văn, thông báo bản quyền trong từng tệp mã.
3. **Phát hành (Release):** Có ít nhất 1 release/tag phiên bản tạo trước thời hạn nộp bài.
4. **Khả năng tái lập:** Hướng dẫn build/install from source rõ ràng, không phụ thuộc công cụ đóng.
5. **Khai báo phụ thuộc (Provenance):** Liệt kê thư viện, phiên bản, nguồn gốc, giấy phép; không tự ý chỉnh sửa mã nguồn thư viện đóng gói.
6. **Tài liệu & Quản lý lỗi:** Có `README.md`, `CHANGELOG.md`, hệ thống theo dõi lỗi (`issue/bug tracker`), tài liệu phản ánh đúng thực tế.
7. **An toàn thông tin:** **TUYỆT ĐỐI KHÔNG commit API key, password, secret, token, dữ liệu nhạy cảm**.
8. **Tính xác thực Git:** Lịch sử commit liên tục, phản ánh quá trình làm việc thực chất qua các mốc thời gian; **không dồn commit vào sát hạn nộp**.

### 2.2. Thang điểm chi tiết (100 Điểm)

| Nhóm | Tiêu chí | Điểm | Nội dung đánh giá & Minh chứng | Mức trừ điểm nếu vi phạm |
|---|---|:---:|---|---|
| **I. PoF (50đ)** | 1. Kho mã nguồn & Lịch sử Git | 5 | Repo công khai, web viewer hoạt động, commit đều đặn, mô tả rõ ràng. | Không có web viewer (-3), không sử dụng thực tế (-5). |
| | 2. Giấy phép nguồn mở | 10 | OSI-approved (Apache-2.0), tương thích license, **ghi trong từng tệp mã**. | Không ghi trong từng tệp (-5), license không tương thích (-5). |
| | 3. Quản lý phiên bản / Release | 5 | Có tag/release trước hạn, định dạng mở, ghi chú phát hành (`Release Notes`). | Không có release (-5), không theo phiên bản (-3). |
| | 4. Build/install from source | 10 | Hướng dẫn build từ source rõ ràng, cấu hình được trước build, có Docker Compose. | Không có hướng dẫn dịch (-5), không cấu hình được (-5). |
| | 5. Quản lý thư viện & Provenance | 10 | Có danh sách thư viện, phiên bản, nguồn gốc, giấy phép (`DEPENDENCIES.md`). | Không có danh sách (-5), sửa code thư viện trái phép (-5). |
| | 6. Tài liệu & Bug tracker | 10 | `README`, `CHANGELOG`, `CONTRIBUTING`, tài liệu kiến trúc/API, GitHub Issues. | Thiếu README (-5), thiếu CHANGELOG (-5), thiếu Bug tracker (-5). |
| **II. Sản phẩm (50đ)** | 7. Đúng kiến trúc DX-OS 3 tầng | 10 | Tầng 1 headless có vai trò thực; đủ Identity, Gateway, Data, Workflow; chứng minh H-P-D-I. | Trừ nặng nếu chỉ làm app CRUD đơn lẻ không có Open-Core. |
| | 8. Mức độ hoàn thiện & ổn định | 10 | Chạy được mượt mà, có dữ liệu mẫu thực tế, luồng nghiệp vụ xuyên suốt, có xử lý ngoại lệ. | Lỗi khi demo, dữ liệu mock tĩnh (-3 đến -10). |
| | 9. Tính thân thiện & Giá trị thực tế | 10 | UX/UI trực quan, giải quyết đúng bài toán DX-Lab đơn vị đào tạo, phân quyền hợp lý. | Giao diện rối, quy trình không sát thực tế. |
| | 10. Chất lượng kỹ thuật & Mở rộng | 10 | Code module hóa, API chuẩn REST/OpenAPI, bảo mật RBAC, có test suite tự động. | Không có test, bảo mật kém, hardcode secret. |
| | 11. Trình diễn & Tiềm năng cộng đồng | 10 | Đúng trọng tâm (10 phút demo + 5 phút Q&A), giải thích rõ ràng kiến trúc, tài liệu đóng góp. | Quá giờ, không trả lời được câu hỏi kiến trúc. |

---

## 3. ĐÁNH GIÁ HIỆN TRẠNG DỰ ÁN DX-FSM

### 3.1. Những điểm đã làm rất tốt (Ưu điểm)
1. **Kiến trúc phân tầng chuẩn mực:**
   * Tầng 1 tách riêng trong thư mục `core/` gồm: Keycloak (SSO/RBAC), Nginx (API Gateway), PostgreSQL 16 (Database), n8n (Workflow Automation), Mailhog (SMTP Dev). Thể hiện đúng vai trò Headless PaaS.
   * Tầng 2 tổ chức microservices sạch sẽ: `ticket-service` (Port 8001), `ai-service` (Port 8002), `notification-service` (Port 8003).
   * Tầng 3 là React 18 SPA hiện đại, phân quyền 3 cổng (Customer, Technician, Manager), có i18n (VI/EN), Dark/Light theme, Responsive.
2. **Kỹ thuật phần mềm nâng cao (Enterprise Design Patterns):**
   * Đã áp dụng **Transactional Outbox Pattern** tại `ticket-service` giúp đảm bảo tính nhất quán dữ liệu phân tán.
   * Đã có **Dead-letter Alerting Worker** tự động bắt lỗi outbox sau 5 lần retry và bắn webhook cảnh báo (chống trùng lặp alert bằng fingerprint).
   * Keycloak RBAC xác thực qua JWT token đồng bộ giữa Frontend và Backend.
3. **Bảo mật & Chuẩn Open Source sạch:**
   * Loại bỏ hoàn toàn hardcoded passwords ở Sprint 5, chuyển sang `${VAR:?error}` trong Docker Compose và tài liệu hóa chính sách xoay vòng secret trong `docs/SECURITY.md`.
   * Kiểm soát secret chặt chẽ với `.secrets.allowlist`.
   * Có test suite tự động cho cả 3 services backend (`pytest`) và frontend (`vitest`).
   * Đã có release tag phiên bản: `v1.1.0-sprint4`, `v1.2.0-sprint5` kèm `RELEASE-NOTES` chi tiết.
   * Lịch sử Git sạch, commit message chuẩn hóa theo quy ước `[role] module: action`.

---

### 3.2. Những thiếu sót & rủi ro bị trừ điểm (Cần cải thiện)

| Mức độ | Vấn đề phát hiện | Nguy cơ bị trừ điểm | Hành động khắc phục cần thiết |
|:---:|---|---|---|
| 🔴 **Rất cao** | **Thiếu file `DEPENDENCIES.md`** | Trừ 5 – 10 điểm PoF (Tiêu chí 5) | `README.md` đang link tới file này nhưng file chưa có. Cần tạo ngay `DEPENDENCIES.md` tổng hợp toàn bộ dependencies, phiên bản, license cho Backend (Python), Frontend (Node), và Docker images. |
| 🔴 **Rất cao** | **Độ phủ SPDX License Header** | Trừ 5 điểm PoF (Tiêu chí 2) | Quy chế OLP yêu cầu license ghi trong từng tệp mã. Cần rà soát tất cả file `.py`, `.ts`, `.tsx`, `.sql` để đảm bảo 100% có header `# SPDX-License-Identifier: Apache-2.0`. |
| 🟡 **Cao** | **Chưa chạy AI thật (Ollama)** | Ảnh hưởng điểm Tiêu chí 8 & 10 (AI trang trí) | AI service đang bị fallback về rule-based do URL hardcode. Cần cấu hình `OLLAMA_BASE_URL` động, kết nối model thật (`llama3.2:3b`), đồng thời giữ fallback khi Ollama offline. |
| 🟡 **Cao** | **Recommender lệch UUID KTV** | Trừ điểm hoàn thiện (Tiêu chí 8) | Seed KTV trong AI service dùng mã giả (`tech-001`), không khớp với UUID trong bảng `technicians` của PostgreSQL khiến gợi ý phân công không trỏ đúng KTV trong DB. |
| 🟡 **Cao** | **Lệch danh mục Category (5 vs 7)** | Lỗi enum khi chạy demo | AI service hỗ trợ 7 categories (`hardware`, `software`, `network`, `electrical`, `access_control`, `service_request`, `other`), nhưng DB/UI chỉ có 5. Cần bổ sung migration hoặc map chuẩn hóa. |
| 🟡 **Trung bình** | **Knowledge Base chưa lên UI** | Giảm điểm năng lực [I] và [H] | Thuật toán KB search (TF-IDF) đã viết rất tốt nhưng chưa có component UI hiển thị. Cần đưa card "Gợi ý tài liệu kỹ thuật" vào màn hình tạo ticket và chi tiết ticket. |
| 🟢 **Thấp** | **Dọn dẹp các route Gateway 404** | Trừ điểm ổn định (Tiêu chí 8) | Nginx gateway đang proxy các route `/solution`, `/duplicate`, `/summary` sang AI service nhưng AI service chưa có endpoint này $\rightarrow$ gọi vào bị 404. Cần dọn bớt hoặc bổ sung stub. |
| 🟢 **Thấp** | **Hồ sơ tài liệu chuẩn số lượng trang** | Tiêu chuẩn hồ sơ tuyển chọn | Cần chuẩn bị Slide demo ($\le$ 12 slide), Video demo (3–5 phút), Báo cáo kỹ thuật (8–10 trang theo đúng bố cục đề thi). |

---

## 4. BỘ CÂU HỎI CHẤT VẤN ĐỊNH HƯỚNG CỦA HỘI ĐỒNG & GỢI Ý TRẢ LỜI

Đề thi HaUI liệt kê sẵn 10 câu hỏi định hướng mà Hội đồng sẽ chất vấn. Đội thi cần nắm vững câu trả lời chuẩn sau:

#### Câu 1: Open-Core của đội nằm ở đâu? Thành phần nào chạy headless và ứng dụng nào sử dụng dịch vụ đó?
* **Trả lời:** Open-Core nằm ở thư mục `core/` (Tầng 1), chạy hoàn toàn ngầm không giao diện người dùng cuối, bao gồm:
  - *Keycloak:* Cung cấp định danh tập trung (SSO/JWT).
  - *Nginx Gateway:* Điều phối định tuyến và kiểm soát truy cập API.
  - *PostgreSQL 16:* Quản lý dữ liệu quan hệ, dữ liệu kiểm toán.
  - *n8n:* Động cơ tự động hóa quy trình workflow.
  - Toàn bộ các dịch vụ H-P-D-I ở Tầng 2 và ứng dụng React SPA ở Tầng 3 đều giao tiếp qua Gateway để tiêu thụ các dịch vụ lõi này.

#### Câu 2: Tại sao đội chọn kiến trúc và stack này? Thành phần nào là nguồn mở và giấy phép gì?
* **Trả lời:** 
  - Toàn bộ hệ thống tuân thủ 100% giấy phép nguồn mở tương thích (OSI-approved): Keycloak (Apache-2.0), Nginx (BSD-2-Clause), PostgreSQL (PostgreSQL License), FastAPI & React (MIT).
  - Bản thân mã nguồn DX-FSM phát hành dưới giấy phép Apache-2.0.
  - Stack được chọn vì tính hiện đại, bất đồng bộ hiệu năng cao (FastAPI asyncpg, React 18 Zustand), dễ đóng gói bằng Docker và hoàn toàn độc lập với các nền tảng nguồn đóng.

#### Câu 3: Nếu thay đổi ứng dụng nghiệp vụ, Open-Core có phải thay đổi theo không? Vì sao?
* **Trả lời:** **Không!** Open-Core ở Tầng 1 đóng vai trò PaaS dùng chung. Nếu tổ chức chuyển sang ứng dụng khác (như quản lý phòng học, tài sản lab), thì Keycloak vẫn giữ vai trò SSO, Nginx vẫn là Gateway, n8n vẫn kích hoạt workflow theo webhook, và PostgreSQL vẫn lưu trữ dữ liệu. Chỉ cần tạo bảng nghiệp vụ mới hoặc thêm workflow trên n8n mà không cần đập đi xây lại nền tảng lõi.

#### Câu 4: Identity/SSO, API Gateway, Data và Workflow được cung cấp như những dịch vụ dùng chung thế nào?
* **Trả lời:**
  - *SSO:* Keycloak cấp Access Token (JWT), mọi service ở Tầng 2 đều xác thực public key từ Keycloak qua JWKS.
  - *Gateway:* Nginx đóng vai trò Single Entrypoint tại cổng 80, che giấu cấu trúc mạng nội bộ của các container.
  - *Data:* PostgreSQL cung cấp kết nối tập trung, phân chia schema và views báo cáo dùng chung.
  - *Workflow:* n8n nhận webhook từ outbox events để kích hoạt các kịch bản gửi mail, thông báo đa kênh.

#### Câu 5: Điểm nào thể hiện H-P-D-I thay vì chỉ là một dashboard CRUD?
* **Trả lời:**
  - Hệ thống tuân thủ nguyên lý chuyển giao quyền điều khiển:
    * **[H]:** Không gian con người số với phân quyền 4 vai trò rõ ràng, cấu trúc tài liệu nội bộ.
    * **[P]:** FSM State Machine có kiểm soát chuyển trạng thái chặt chẽ (**Poka-yoke**), ngăn chặn hành động trái quyền, tích hợp Transactional Outbox Pattern để bảo đảm toàn vẹn dữ liệu quy trình.
    * **[D]:** Bảng điều khiển thời gian thực tính toán SLA, tải kỹ thuật viên, tự động làm mới mỗi 30s.
    * **[I]:** Tác tử AI tự động phân loại sự cố và đề xuất KTV phù hợp nhất theo thuật toán đa tiêu chuẩn, hỗ trợ con người ra quyết định nhanh hơn (Human-in-the-loop).

#### Câu 6: AI/ML được dùng ở đâu? Dữ liệu đầu vào, mô hình, đánh giá và giới hạn của kết quả là gì?
* **Trả lời:**
  - AI được tích hợp tại 3 điểm nghiệp vụ thực tế:
    1. *Ticket Classifier:* Phân loại category và priority từ title/description. Kiến trúc Hybrid 3 tầng: Cache (SHA-256) $\rightarrow$ Ollama LLM (`llama3.2:3b`) $\rightarrow$ Rule-based Fallback. Độ chính xác đạt **99.00%** (198/200 mẫu) với Macro F1 **99.6%**, độ trễ sub-0.2ms trên CPU.
    2. *Knowledge Base Search:* Pure Python TF-IDF + Cosine Similarity tìm bài viết khắc phục sự cố, trọng số tiêu đề gấp 3 lần.
    3. *Technician Recommender:* Chấm điểm đa tiêu chí (chuyên môn 40%, kỹ năng 15%, lịch sử 20%, tải hiện tại 15%, cấp bậc 5%, độ tươi 5%) kết hợp Collaborative Filtering boost.
  - *Giới hạn:* LLM chạy trên máy cá nhân có thể trễ khi cold start $\rightarrow$ giải quyết bằng warm-up background và timeout fallback.

#### Câu 7: Nếu một nguồn dữ liệu/API ngừng hoạt động, hệ thống xử lý thế nào? (Tính tự phục hồi & Fallback)
* **Trả lời:**
  - Thiết kế theo nguyên tắc *Graceful Degradation*:
    - Nếu Ollama tắt/lỗi $\rightarrow$ Tự động hạ cấp xuống rule-based keyword scoring, ticket vẫn được tạo bình thường.
    - Nếu AI service tắt hoàn toàn $\rightarrow$ Frontend vẫn cho phép người dùng tự chọn danh mục và phân công thủ công bằng heuristic nội bộ.
    - Nếu n8n hoặc hệ thống gửi mail lỗi $\rightarrow$ Transactional Outbox lưu sự kiện vào CSDL, retry 5 lần theo exponential backoff; nếu thất bại hoàn toàn chuyển vào Dead-letter Alerting để người quản trị xử lý mà không làm gián đoạn giao dịch của người dùng.

#### Câu 8: Đội có thể build toàn bộ hệ thống từ source trên một máy mới không?
* **Trả lời:** **Hoàn toàn được.** 
  - Toàn bộ môi trường được cấu hình hóa qua Docker Compose (`docker compose up -d --build`).
  - Ngoài ra, từng service đều có thể chạy độc lập từ source code theo hướng dẫn trong `README.md` (FastAPI với `uvicorn`, React với `npm run dev`).
  - Cấu hình môi trường được tách bạch rõ ràng qua file `.env.example`.

#### Câu 9: Nếu tăng từ 100 lên 100.000 người dùng, kiến trúc sẽ thay đổi thế nào?
* **Trả lời:**
  - *Tầng Gateway:* Thay Nginx đơn lẻ bằng Nginx Cluster hoặc Apache APISIX kết hợp load balancer (HAProxy/F5).
  - *Tầng Service:* Các microservice (Ticket, AI, Notification) là stateless, có thể scale ngang (horizontal scaling) nhiều replica trên Kubernetes/Docker Swarm.
  - *Tầng CSDL:* Bổ sung PgBouncer để quản lý connection pooling; tách Read-Replica cho các truy vấn báo cáo/dashboard và Master cho ghi dữ liệu; đưa Redis vào làm cache phân tán cho Keycloak session và AI cache.

#### Câu 10: Nếu cộng đồng muốn đóng góp một module mới, quy trình contribution của dự án là gì?
* **Trả lời:**
  - Dự án có tài liệu `CONTRIBUTING.md` và `CODE_OF_CONDUCT.md` hướng dẫn chi tiết.
  - Quy trình chuẩn GitHub Flow: Fork repo $\rightarrow$ Tạo feature branch $\rightarrow$ Tuân thủ chuẩn code (Ruff cho Python, ESLint/Prettier cho React, SPDX License Header) $\rightarrow$ Viết unit test $\rightarrow$ Tạo Pull Request có checklist kiểm tra $\rightarrow$ CI chạy tự động kiểm tra build/test $\rightarrow$ Review và merge.

---

## 5. KẾ HOẠCH HÀNH ĐỘNG CỤ THỂ (ACTION PLAN)

### Giai đoạn 1: Chốt chặn PoF (Hoàn thành trong 24h tới)
- [x] **Tạo file `DEPENDENCIES.md`:** Liệt kê đầy đủ tên package, phiên bản, nguồn gốc, giấy phép cho Backend (FastAPI, SQLAlchemy, ...), Frontend (React, TanStack, ...) và Docker Images.
- [x] **Audit SPDX License Headers:** Chạy script kiểm tra và bổ sung `# SPDX-License-Identifier: Apache-2.0` vào 100% các file mã nguồn chưa có.
- [x] **Kiểm tra chạy từ source:** Test chạy độc lập backend và frontend trên môi trường local không dùng Docker theo đúng hướng dẫn trong README.
- [x] **Tạo GitHub Issues:** Tạo các Issue mô phỏng các task Sprint 4, Sprint 5 và Sprint AI sắp tới trên GitHub để hoàn thiện minh chứng Bug Tracker.

### Giai đoạn 2: Đưa AI vào sử dụng thật (Thực hiện `docs/ai-production-plan.md`)
- [x] **P0 + P1 (Ollama LLM):** Cấu hình `OLLAMA_BASE_URL` động qua biến môi trường; bóc code fence JSON; warm-up model lúc startup; kiểm thử fallback êm khi tắt Ollama.
- [x] **P3 (Đồng bộ Category):** Thêm migration CSDL bổ sung 2 category còn thiếu (`access_control`, `service_request`) hoặc ánh xạ chuẩn hóa tại AI service để không bao giờ lỗi enum.
- [x] **P4 (Khớp dữ liệu KTV):** Cập nhật seed dữ liệu trong `recommender_v2.py` sang đúng UUID của các KTV trong bảng `technicians`.
- [x] **P5 (Hiển thị KB trên UI):** Bổ sung API client `searchKb` và hiển thị gợi ý bài viết liên quan trên giao diện `TicketCreate` và `TicketDetail`.
- [ ] **P6 (Dọn dẹp Gateway):** Xóa các route không sử dụng (`/solution`, `/duplicate`, `/summary`) trong `core/nginx/nginx.conf`.

### Giai đoạn 3: Chuẩn bị Hồ sơ Nộp bài & Showcase (Trước ngày Demo)
- [ ] **Báo cáo kỹ thuật (`docs/technical-report.md`):** Chuẩn hóa dung lượng 8–10 trang theo đúng cấu trúc đề thi yêu cầu (Tập trung Open-Core, H-P-D-I, ứng dụng DX-Lab HaUI, luồng dữ liệu, AI/ML, License).
- [ ] **Slide thuyết trình:** Thiết kế tối đa **12 slide** tập trung: Vấn đề $\rightarrow$ Kiến trúc 3 tầng DX-OS $\rightarrow$ Không gian H-P-D-I $\rightarrow$ Công nghệ mở & PoF $\rightarrow$ Điểm sáng kỹ thuật (Outbox, AI Hybrid) $\rightarrow$ Định hướng tương lai.
- [ ] **Video Demo:** Quay video 3–5 phút chạy xuyên suốt luồng: *Khách hàng tạo ticket (AI gợi ý) $\rightarrow$ Manager xem Dashboard & Phân công (AI gợi ý KTV) $\rightarrow$ KTV nhận việc & Xử lý $\rightarrow$ Khách hàng đóng ticket $\rightarrow$ Outbox gửi thông báo*.
- [ ] **Tập dượt Showcase:** Căn chuẩn thời lượng **10 phút demo + 5 phút trả lời câu hỏi** theo đúng kịch bản `docs/demo-script.md`.

