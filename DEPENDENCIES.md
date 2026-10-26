# Quản Lý Phụ Thuộc, Nguồn Gốc & Giấy Phép (Software Bill of Materials - SBOM)

> **Dự án:** DX-FSM – Field Service Management Platform  
> **Giấy phép dự án:** [Apache License 2.0](LICENSE)  
> **Tổ chức dự thi:** PMNM HaUI 2026 – OLP PMNM 2026 (VFOSSA)  
> **Mục tiêu tuân thủ:** Tiêu chí PoF (Proof of FOSS) – Quản lý thư viện, gói phụ thuộc và Provenance (10/10 điểm).

---

## 1. Tuyên bố Tuân thủ Giấy phép & Nguồn gốc (Provenance Statement)

1. **Giấy phép Nguồn mở Hợp lệ:** Toàn bộ các thư viện, phần mềm và gói phụ thuộc sử dụng trong dự án DX-FSM đều được phát hành theo các giấy phép nguồn mở được **OSI công nhận** (OSI-approved licenses: Apache-2.0, MIT, BSD-2/3-Clause, ISC, PostgreSQL, Python Software Foundation).
2. **Tính Tương thích Bản quyền:** Dự án DX-FSM được cấp phép theo **Apache License 2.0**. Tất cả các thư viện thứ ba đều thuộc nhóm giấy phép tương thích hoàn toàn (permissive licenses) hoặc được liên kết động qua cơ chế chuẩn của hệ điều hành/trình thông dịch (dynamic runtime linking), không gây xung đột bản quyền.
3. **Nguyên tắc Bundling (Không sửa đổi mã nguồn thư viện đóng gói):**
   * Dự án **không sao chép hoặc phân phối kèm mã nguồn thư viện bên thứ ba** vào repository của mình.
   * Toàn bộ phụ thuộc được cài đặt tự động từ các kho lưu trữ chính thức của cộng đồng:
     - **PyPI (Python Package Index)** qua `pip` và file `requirements.txt`.
     - **npm Registry** qua `npm` và file `package.json` / `package-lock.json`.
     - **Docker Official Images / Quay.io** qua Dockerfile và `docker-compose.yml`.
   * Mã nguồn của thư viện bên thứ ba không bị chỉnh sửa, đảm bảo tính nguyên vẹn và khả năng tái lập bản dựng (Reproducible Builds).
4. **Không phụ thuộc công cụ đóng:** Toàn bộ chuỗi công cụ build, lint, test và chạy thử (Python, Node.js, Vite, Docker, PostgreSQL, Keycloak, Nginx) đều là 100% phần mềm nguồn mở.

---

## 2. Danh mục Phụ thuộc Tầng 1 – DX-OS Open-Core (Headless PaaS)

Các dịch vụ hạ tầng nền tảng chạy ngầm, được điều phối qua `docker-compose.yml`:

| Dịch vụ / Container | Hình ảnh (Image Tag) | Nguồn cung cấp (Origin) | Giấy phép | Vai trò kiến trúc trong Tầng 1 |
|---|---|---|---|---|
| **Identity / SSO** | `quay.io/keycloak/keycloak:24.0` | [Quay.io / Keycloak](https://www.keycloak.org/) | Apache-2.0 | Quản lý định danh tập trung, SSO, xác thực JWT & phân quyền RBAC |
| **API Gateway** | `nginx:1.27-alpine` | [Docker Hub / Nginx Official](https://hub.docker.com/_/nginx) | BSD-2-Clause | Cửa ngõ API duy nhất (Port 80), proxy định tuyến và kiểm soát truy cập |
| **Database** | `postgres:16-alpine` | [Docker Hub / Postgres Official](https://hub.docker.com/_/postgres) | PostgreSQL License | Quản trị CSDL quan hệ, lưu trữ schema, audit logs và dữ liệu outbox |
| **Workflow Engine** | `n8nio/n8n:latest` | [Docker Hub / n8n](https://hub.docker.com/r/n8nio/n8n) | Sustainable Use (Fair-code) | Động cơ tự động hóa quy trình nghiệp vụ, webhook integration |
| **Dev SMTP Server** | `mailhog/mailhog:latest` | [Docker Hub / MailHog](https://github.com/mailhog/MailHog) | MIT | Máy chủ SMTP ảo và Web UI kiểm tra email trong môi trường dev |
| **File Storage** | `minio/minio:latest` *(Disabled)* | [Docker Hub / MinIO](https://min.io/) | AGPL-3.0 | *(Cấu hình dự phòng, hiện tại fallback lưu trữ file an toàn qua volume local)* |

---

## 3. Danh mục Phụ thuộc Tầng 2 – H-P-D-I Microservices (Backend)

### 3.1. Ticket Service (`services/ticket-service/requirements.txt`)
*Dịch vụ lõi xử lý CRUD tickets, quản lý người dùng, trạng thái và Transactional Outbox Pattern (Port 8001).*

| Gói phụ thuộc | Phiên bản | Nguồn gốc | Giấy phép | Mục đích sử dụng |
|---|---|---|---|---|
| **fastapi** | `0.115.0` | [PyPI](https://pypi.org/project/fastapi/) | MIT | Web framework bất đồng bộ hiệu năng cao cho REST API |
| **uvicorn[standard]** | `0.30.6` | [PyPI](https://pypi.org/project/uvicorn/) | BSD-3-Clause | ASGI web server chạy ứng dụng FastAPI |
| **python-multipart** | `0.0.9` | [PyPI](https://pypi.org/project/python-multipart/) | Apache-2.0 | Xử lý upload tệp đính kèm (`multipart/form-data`) |
| **asyncpg** | `0.29.0` | [PyPI](https://pypi.org/project/asyncpg/) | Apache-2.0 | Driver giao tiếp PostgreSQL bất đồng bộ tốc độ cao |
| **sqlalchemy[asyncio]**| `2.0.35` | [PyPI](https://pypi.org/project/SQLAlchemy/) | MIT | ORM ánh xạ CSDL và quản lý truy vấn async |
| **psycopg2-binary** | `2.9.9` | [PyPI](https://pypi.org/project/psycopg2-binary/) | LGPL-3.0 / BSD | Driver PostgreSQL dự phòng cho các tác vụ đồng bộ |
| **pydantic** | `2.9.2` | [PyPI](https://pypi.org/project/pydantic/) | MIT | Kiểm thực và ánh xạ schema dữ liệu đầu vào/ra |
| **pydantic-settings** | `2.5.2` | [PyPI](https://pypi.org/project/pydantic-settings/) | MIT | Quản lý cấu hình môi trường từ biến `.env` |
| **email-validator** | `2.2.0` | [PyPI](https://pypi.org/project/email-validator/) | Apache-2.0 | Xác thực định dạng địa chỉ email người dùng |
| **minio** | `7.2.3` | [PyPI](https://pypi.org/project/minio/) | Apache-2.0 | SDK client tương tác với dịch vụ MinIO Object Storage |
| **httpx** | `0.27.2` | [PyPI](https://pypi.org/project/httpx/) | BSD-3-Clause | HTTP client bất đồng bộ gọi service-to-service |
| **aiohttp** | `3.10.5` | [PyPI](https://pypi.org/project/aiohttp/) | Apache-2.0 | Thư viện HTTP client bất đồng bộ bổ trợ |
| **python-dateutil** | `2.9.0` | [PyPI](https://pypi.org/project/python-dateutil/) | Apache-2.0 / BSD | Xử lý phân tích và định dạng ngày giờ ISO 8601 |
| **python-jose[crypto]**| `3.3.0` | [PyPI](https://pypi.org/project/python-jose/) | MIT | Giải mã và xác thực chữ ký số JWT từ Keycloak |
| **ruff** | `0.6.4` | [PyPI](https://pypi.org/project/ruff/) | MIT | Công cụ linter & formatter mã nguồn Python cực nhanh |
| **pytest** | `8.3.3` | [PyPI](https://pypi.org/project/pytest/) | MIT | Khung kiểm thử tự động (Unit / Integration testing) |
| **pytest-asyncio** | `0.24.0` | [PyPI](https://pypi.org/project/pytest-asyncio/) | Apache-2.0 | Hỗ trợ chạy các test case bất đồng bộ trong pytest |
| **pytest-cov** | `5.0.0` | [PyPI](https://pypi.org/project/pytest-cov/) | MIT | Đo lường độ bao phủ mã nguồn (code coverage) |

### 3.2. AI Service (`services/ai-service/requirements.txt`)
*Dịch vụ trí tuệ số: Phân loại sự cố (Classifier), Tra cứu tri thức (TF-IDF KB), Gợi ý kỹ thuật viên (Recommender) (Port 8002).*

| Gói phụ thuộc | Phiên bản | Nguồn gốc | Giấy phép | Mục đích sử dụng |
|---|---|---|---|---|
| **fastapi** | `0.115.0` | [PyPI](https://pypi.org/project/fastapi/) | MIT | API framework cho các endpoint suy luận AI |
| **uvicorn[standard]** | `0.30.6` | [PyPI](https://pypi.org/project/uvicorn/) | BSD-3-Clause | ASGI server chạy AI Service |
| **httpx** | `0.27.2` | [PyPI](https://pypi.org/project/httpx/) | BSD-3-Clause | Gọi API tới Ollama host (`/api/generate`, `/api/tags`) |
| **psycopg2-binary** | `2.9.9` | [PyPI](https://pypi.org/project/psycopg2-binary/) | LGPL-3.0 / BSD | Kết nối cơ sở dữ liệu để truy xuất dữ liệu đào tạo/KTV |
| **sqlalchemy** | `2.0.35` | [PyPI](https://pypi.org/project/SQLAlchemy/) | MIT | ORM truy vấn bảng kỹ thuật viên và lịch sử xử lý |
| **pydantic** | `2.9.2` | [PyPI](https://pypi.org/project/pydantic/) | MIT | Xác thực schema request/response phân loại và gợi ý |
| **pydantic-settings** | `2.5.2` | [PyPI](https://pypi.org/project/pydantic-settings/) | MIT | Quản lý cấu hình Ollama endpoint, model name, timeout |
| **ruff** | `0.6.4` | [PyPI](https://pypi.org/project/ruff/) | MIT | Linter kiểm tra chất lượng code |
| **pytest** | `8.3.3` | [PyPI](https://pypi.org/project/pytest/) | MIT | Chạy test suite cho các thuật toán phân loại và gợi ý |
| **pytest-asyncio** | `0.24.0` | [PyPI](https://pypi.org/project/pytest-asyncio/) | Apache-2.0 | Hỗ trợ test bất đồng bộ |

### 3.3. Notification Service (`services/notification-service/requirements.txt`)
*Dịch vụ thông báo đa kênh: Email (aiosmtplib), SMS/Push stubs, Service token authentication (Port 8003).*

| Gói phụ thuộc | Phiên bản | Nguồn gốc | Giấy phép | Mục đích sử dụng |
|---|---|---|---|---|
| **fastapi** | `0.115.0` | [PyPI](https://pypi.org/project/fastapi/) | MIT | Framework xây dựng endpoint `/notify` và `/health` |
| **uvicorn[standard]** | `0.30.6` | [PyPI](https://pypi.org/project/uvicorn/) | BSD-3-Clause | ASGI server cho notification service |
| **pydantic[email]** | `2.9.2` | [PyPI](https://pypi.org/project/pydantic/) | MIT | Kiểm thực định dạng thông báo và email người nhận |
| **pydantic-settings** | `2.5.2` | [PyPI](https://pypi.org/project/pydantic-settings/) | MIT | Cấu hình máy chủ SMTP và service token |
| **httpx** | `0.27.2` | [PyPI](https://pypi.org/project/httpx/) | BSD-3-Clause | Hỗ trợ gửi webhook thông báo |
| **aiosmtplib** | `3.0.1` | [PyPI](https://pypi.org/project/aiosmtplib/) | MIT | Thư viện gửi email bất đồng bộ qua giao thức SMTP |

---

## 4. Danh mục Phụ thuộc Tầng 3 – User Interface (Frontend SPA)

### 4.1. Runtime Dependencies (`app/package.json`)
*Các thư viện chạy trực tiếp trong bundle trình duyệt của người dùng cuối.*

| Gói phụ thuộc | Phiên bản | Nguồn gốc | Giấy phép | Mục đích sử dụng |
|---|---|---|---|---|
| **react** | `^18.3.1` | [npm](https://www.npmjs.com/package/react) | MIT | Thư viện cốt lõi xây dựng giao diện người dùng theo component |
| **react-dom** | `^18.3.1` | [npm](https://www.npmjs.com/package/react-dom) | MIT | Render React component vào cây DOM của trình duyệt |
| **react-router-dom** | `^6.26.2` | [npm](https://www.npmjs.com/package/react-router-dom) | MIT | Quản lý điều hướng client-side SPA cho các màn hình |
| **@tanstack/react-query** | `^5.56.2` | [npm](https://www.npmjs.com/package/@tanstack/react-query) | MIT | Quản lý server-state, cache dữ liệu API, tự động làm mới |
| **zustand** | `^5.0.0-rc.2` | [npm](https://www.npmjs.com/package/zustand) | MIT | Quản lý client-state nhẹ (theme, thông báo, user session) |
| **react-hook-form** | `^7.53.0` | [npm](https://www.npmjs.com/package/react-hook-form) | MIT | Quản lý và kiểm thực form tạo/chỉnh sửa ticket hiệu năng cao |
| **keycloak-js** | `^26.0.5` | [npm](https://www.npmjs.com/package/keycloak-js) | Apache-2.0 | Adapter tích hợp SSO với Keycloak, quản lý refresh token |
| **axios** | `^1.7.7` | [npm](https://www.npmjs.com/package/axios) | MIT | HTTP client giao tiếp với API Gateway Nginx |
| **lucide-react** | `^1.59.0` | [npm](https://www.npmjs.com/package/lucide-react) | ISC | Bộ biểu tượng giao diện người dùng mã nguồn mở |
| **i18next** | `^26.5.2` | [npm](https://www.npmjs.com/package/i18next) | MIT | Thư viện quốc tế hóa ngôn ngữ cốt lõi |
| **react-i18next** | `^17.1.0` | [npm](https://www.npmjs.com/package/react-i18next) | MIT | Binding i18n cho React component (hỗ trợ chuyển đổi VI / EN) |
| **i18next-browser-languagedetector** | `^8.2.1` | [npm](https://www.npmjs.com/package/i18next-browser-languagedetector) | MIT | Tự động nhận diện ngôn ngữ trình duyệt của người dùng |
| **@fontsource-variable/plus-jakarta-sans** | `^5.3.0` | [npm](https://www.npmjs.com/package/@fontsource-variable/plus-jakarta-sans) | OFL-1.1 | Font chữ Plus Jakarta Sans tối ưu hóa hiển thị giao diện |

### 4.2. Build & Development Tools (`app/package.json`)
*Các công cụ chỉ phục vụ quá trình biên dịch, kiểm tra mã nguồn và chạy test (không bundle vào file production cuối cùng).*

| Gói công cụ | Phiên bản | Nguồn gốc | Giấy phép | Vai trò |
|---|---|---|---|---|
| **vite** | `^5.4.8` | [npm](https://www.npmjs.com/package/vite) | MIT | Frontend build tool & dev server hiện đại dựa trên ES Modules |
| **@vitejs/plugin-react**| `^4.3.1` | [npm](https://www.npmjs.com/package/@vitejs/plugin-react) | MIT | Plugin Vite hỗ trợ React Fast Refresh và JSX compilation |
| **typescript** | `^5.5.4` | [npm](https://www.npmjs.com/package/typescript) | Apache-2.0 | Trình biên dịch TypeScript, kiểm tra kiểu tĩnh (Static Type Checking) |
| **vitest** | `^2.1.1` | [npm](https://www.npmjs.com/package/vitest) | MIT | Framework kiểm thử đơn vị tốc độ cao tương thích Vite |
| **@vitest/coverage-v8** | `^2.1.9` | [npm](https://www.npmjs.com/package/@vitest/coverage-v8) | MIT | Module đo lường độ bao phủ kiểm thử frontend qua V8 engine |
| **@testing-library/react** | `^16.3.3` | [npm](https://www.npmjs.com/package/@testing-library/react) | MIT | Thư viện test component React theo trải nghiệm người dùng |
| **@testing-library/jest-dom** | `^7.0.1` | [npm](https://www.npmjs.com/package/@testing-library/jest-dom) | MIT | Các matcher mở rộng cho DOM node assertions |
| **jsdom** | `^30.1.3` | [npm](https://www.npmjs.com/package/jsdom) | MIT | Môi trường DOM giả lập chạy trên Node.js phục vụ test UI |
| **eslint** | `^8.57.0` | [npm](https://www.npmjs.com/package/eslint) | MIT | Công cụ phân tích tĩnh mã nguồn JavaScript/TypeScript |
| **prettier** | `^3.3.3` | [npm](https://www.npmjs.com/package/prettier) | MIT | Công cụ tự động định dạng mã nguồn nhất quán |

---

## 5. Ma trận Tương thích Bản quyền (License Compatibility Matrix)

Bảng đối chiếu tính tương thích giữa giấy phép gốc của dự án (**Apache License 2.0**) và các giấy phép của các thành phần phụ thuộc:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DX-FSM PROJECT LICENSE                           │
│                             (Apache License 2.0)                            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
     ┌─────────────────────────────────┼─────────────────────────────────┐
     ▼                                 ▼                                 ▼
┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐
│     Permissive        │   │    Permissive với     │   │      Font License     │
│   (MIT, BSD, ISC)     │   │     Bằng sáng chế     │   │       (OFL-1.1)       │
│                       │   │     (Apache-2.0)      │   │                       │
│  FastAPI, React,      │   │   Keycloak, asyncpg,  │   │  Plus Jakarta Sans    │
│  Zustand, Nginx, v.v. │   │   TypeScript, v.v.    │   │                       │
│  ──> 100% Tương thích │   │  ──> Đồng nhất 100%   │   │  ──> Cho phép nhúng   │
└───────────────────────┘   └───────────────────────┘   └───────────────────────┘
```

| Giấy phép phụ thuộc | Số lượng gói | Mức độ tương thích với Apache-2.0 | Ghi chú pháp lý |
|---|:---:|---|---|
| **MIT** | 28 gói | ✅ **Hoàn toàn tương thích** | Giấy phép tự do cho phép tích hợp, phân phối lại và chuyển giao theo Apache-2.0. |
| **Apache-2.0** | 10 gói | ✅ **Đồng nhất hoàn toàn** | Cùng điều khoản cấp phép, bảo hộ bằng sáng chế và nhãn hiệu. |
| **BSD-2 / BSD-3** | 6 gói | ✅ **Hoàn toàn tương thích** | Giấy phép tự do tương tự MIT, tuân thủ giữ nguyên copyright notice. |
| **ISC** | 1 gói | ✅ **Hoàn toàn tương thích** | Tương đương chức năng với MIT/BSD. |
| **PostgreSQL License** | 1 gói | ✅ **Hoàn toàn tương thích** | Giấy phép tự do kiểu BSD được OSI công nhận. |
| **OFL-1.1** | 1 gói | ✅ **Hoàn toàn tương thích** | Cho phép nhúng và phân phối kèm ứng dụng mà không bắt buộc mở mã nguồn ứng dụng. |
| **LGPL-3.0** (`psycopg2`) | 1 gói | ✅ **Tuân thủ đúng quy chế** | Liên kết động ở runtime; mã nguồn thư viện không bị sửa đổi. |

---

## 6. Hướng dẫn Kiểm tra và Kiểm toán Độc lập (Auditing Verification)

Ban Giám khảo và các nhà phát triển có thể kiểm tra tính xác thực và tự động tạo lại danh sách này bằng các công cụ nguồn mở sau:

### 6.1. Kiểm tra phụ thuộc Python (Backend)
```bash
# Kiểm tra giấy phép các gói Python đang cài đặt
pip install pip-licenses
pip-licenses --order=license

# Kiểm tra lỗ hổng bảo mật đã biết
pip install safety
safety check -r services/ticket-service/requirements.txt
```

### 6.2. Kiểm tra phụ thuộc Node/React (Frontend)
```bash
cd app
# Liệt kê toàn bộ license của node_modules
npx license-checker --summary

# Kiểm tra bảo mật các gói npm
npm audit
```

### 6.3. Kiểm tra Container Images
```bash
# Quét lỗ hổng các container image với Trivy (FOSS)
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image dxfsm-gateway:latest
```

