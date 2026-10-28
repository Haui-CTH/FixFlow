# Báo Cáo Thẩm Định Bản Quyền Nguồn Mở & Tuân Thủ Chuẩn OSI (License Audit)

> **Dự án:** FixFlow (DX-FSM) — Quản lý Dịch vụ Kỹ thuật Thực địa trên nền DX-OS Open-Core  
> **Cam kết:** 100% thành phần tuân thủ giấy phép phần mềm tự do nguồn mở được phê duyệt bởi **Open Source Initiative (OSI)**. Không có thành phần độc quyền, không có giấy phép hạn chế thương mại (Non-OSI).

---

## 1. Giấy phép của mã nguồn tự phát triển

Toàn bộ mã nguồn do đội thi phát triển trong khuôn khổ dự án FixFlow được phát hành theo giấy phép chuẩn:
- **Giấy phép:** [Apache License 2.0](../LICENSE)
- **Đặc tính:** Giấy phép mã nguồn mở tự do, cho phép sử dụng, sửa đổi, phân phối cho mục đích phi thương mại lẫn thương mại, có điều khoản bảo hộ quyền sáng chế rõ ràng, tương thích hoàn toàn với hệ sinh thái nguồn mở thế giới.
- **Đánh dấu bản quyền:** Mọi tệp mã nguồn (`.py`, `.ts`, `.tsx`, `.css`, `.properties`, `.sh`) đều được gắn tiêu đề định danh chuẩn:
  ```text
  SPDX-License-Identifier: Apache-2.0
  ```

---

## 2. Bảng kiểm tra giấy phép các thành phần thượng nguồn (Dependencies & Upstream)

| Thành phần | Vai trò trong hệ thống | Phiên bản | Giấy phép | Đạt chuẩn OSI? |
| :--- | :--- | :--- | :--- | :---: |
| **Keycloak** | Định danh & Phân quyền SSO (Tầng 1) | 24.0.5 | **Apache-2.0** |  Có |
| **Nginx** | Cổng giao tiếp biên API Gateway (Tầng 1) | 1.27 Alpine | **2-clause BSD-like** |  Có |
| **PostgreSQL** | Cơ sở dữ liệu quan hệ chính (Tầng 1) | 16 Alpine | **PostgreSQL License** |  Có |
| **MinIO** | Lưu trữ đối tượng S3 Object Storage (Tầng 1) | RELEASE.2024+ | **AGPL-3.0** |  Có |
| **Python** | Nền tảng thực thi Backend microservices | 3.11 / 3.12 | **PSF License** |  Có |
| **FastAPI** | Web framework cho Ticket, AI, Notification | 0.110+ | **MIT** |  Có |
| **SQLAlchemy** | Thư viện ORM truy xuất CSDL bất đồng bộ | 2.0+ | **MIT** |  Có |
| **Alembic** | Công cụ kiểm soát phiên bản CSDL (Migration) | 1.13+ | **MIT** |  Có |
| **Scikit-Learn** | Thư viện TF-IDF Vectorizer cho Knowledge Base | 1.4+ | **BSD-3-Clause** |  Có |
| **React** | Thư viện xây dựng giao diện người dùng Web | 18.3+ | **MIT** |  Có |
| **Vite** | Công cụ đóng gói và biên dịch Frontend | 5.0+ | **MIT** |  Có |
| **Lucide React** | Bộ biểu tượng giao diện công thái học | 0.400+ | **ISC** |  Có |
| **Vitest** | Khung kiểm thử tự động Frontend | 2.1+ | **MIT** |  Có |

---

## 3. Phân tích các "Bẫy Giấy Phép" (License Traps) & Lựa chọn kỹ thuật của FixFlow

Trong đề bài tham chiếu của VFOSSA có nhắc tới một số công nghệ phổ biến nhưng đã bị thay đổi giấy phép trong thời gian gần đây (không còn thuộc danh mục nguồn mở của OSI). FixFlow đã chủ động nhận diện và đưa ra các quyết định thiết kế thay thế an toàn:

### 3.1. Tránh bẫy HashiCorp Vault (BUSL-1.1)
- **Vấn đề:** HashiCorp đã chuyển Vault từ giấy phép MPL-2.0 sang Business Source License (BUSL-1.1) từ tháng 8/2023. Đây là giấy phép hạn chế thương mại, **không được OSI công nhận là mã nguồn mở**.
- **Giải pháp của FixFlow:** FixFlow không đưa Vault vào hệ thống. Việc quản lý bí mật (Keycloak Client Secret, MinIO Root Secret, Database Password) được nạp an toàn thông qua biến môi trường container cách ly (`.env`), kiểm soát quyền đọc ở cấp máy chủ và tự động quét lộ lọt bằng Git pre-commit hooks.

### 3.2. Tránh bẫy MongoDB (SSPL-1.0)
- **Vấn đề:** MongoDB chuyển sang Server Side Public License (SSPL) từ 2018 và bị OSI từ chối công nhận.
- **Giải pháp của FixFlow:** FixFlow kiên quyết không dùng MongoDB. Mọi dữ liệu bán cấu trúc (Metadata, Telemetry cảm biến IoT, Outbox Payload, History changes) được lưu trữ hoàn hảo bằng kiểu dữ liệu **JSONB** gốc của PostgreSQL 16 (vừa đảm bảo chuẩn ACID, vừa có chỉ mục GIN siêu tốc, vừa có giấy phép mở PostgreSQL License 100%).

### 3.3. Xử lý bài toán MinIO (AGPL-3.0) & Cơ chế chuyển đổi dự phòng
- **Vấn đề:** MinIO duy trì AGPL-3.0 nhưng đã ngừng phát hành một số tiện ích công khai.
- **Giải pháp của FixFlow:** FixFlow thiết kế lớp trừu tượng lưu trữ [`StorageService`](../services/ticket-service/app/services/storage_service.py). Hệ thống giao tiếp qua chuẩn giao thức mở **S3 API**. Khi cần thiết, hệ thống có thể chuyển sang **SeaweedFS** (Apache-2.0) mà không sửa bất kỳ dòng mã nghiệp vụ nào; đồng thời có sẵn cơ chế **Local Storage Fallback** tự động khi không có cụm S3.

### 3.4. Vị thế của n8n (Sustainable Use License)
- **Vấn đề:** n8n sử dụng Sustainable Use License (fair-code, giới hạn thương mại nội bộ).
- **Giải pháp của FixFlow:** n8n chỉ được bố trí như một công cụ mở rộng phụ trợ (automation sidecar), hoàn toàn **không nằm trong đường dẫn thực thi cốt lõi (critical path)** của Ticket Service và AI Service. Toàn bộ logic chuyển trạng thái quy trình nghiệp vụ chính do State Machine tự viết bên trong `ticket-service` (Apache-2.0) trực tiếp kiểm soát.

---

## 4. Kết luận

Hệ thống FixFlow đảm bảo:
1.  **Không có xung đột giấy phép** (No license viral contamination).
2.  **100% thành phần đều tự cài đặt được (Self-hosted)**, không phụ thuộc vào bất kỳ dịch vụ đám mây trả phí của bên thứ ba nào.
3.  **Bảo vệ chủ quyền số toàn diện:** Toàn bộ dữ liệu, mô hình AI và mã nguồn đều nằm trên hạ tầng do tổ chức làm chủ.
