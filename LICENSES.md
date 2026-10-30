<!-- SPDX-License-Identifier: Apache-2.0 -->
# Bản Quyền & Giấy Phép Phần Mềm Nguồn Mở (Open Source Licenses)

> **Dự án:** FixFlow — Nền tảng Quản lý Dịch vụ Kỹ thuật Thực địa (DX-FSM) trên Lõi mở DX-OS  
> **Giấy phép chính:** [Apache License 2.0](LICENSE)  
> **Cam kết:** 100% mã nguồn tự phát triển và thư viện phụ thuộc tuân thủ chuẩn mã nguồn mở được công nhận bởi **Open Source Initiative (OSI)**. Tuyệt đối không chứa giấy phép hạn chế thương mại (Non-OSI, BUSL, SSPL).

---

## 1. Giấy phép Mã nguồn Dự án FixFlow

Toàn bộ mã nguồn do đội ngũ FixFlow phát triển được phát hành theo giấy phép **Apache License 2.0**.
* Toàn văn giấy phép được lưu tại tệp: [`LICENSE`](LICENSE).
* Mọi tệp mã nguồn đều được gắn tiêu đề định danh bản quyền chuẩn:
  ```text
  SPDX-License-Identifier: Apache-2.0
  ```

---

## 2. Báo cáo Thẩm định Giấy phép & Tránh bẫy Bản quyền

Chi tiết thẩm định từng thư viện và cách FixFlow phòng tránh các bẫy giấy phép thương mại (như HashiCorp Vault BUSL-1.1, MongoDB SSPL, v.v.):
* **Báo cáo Thẩm định Chi tiết:** [`docs/licenses-audit.md`](docs/licenses-audit.md)
* **Bản kê Phụ thuộc & Nguồn gốc (SBOM):** [`DEPENDENCIES.md`](DEPENDENCIES.md)
* **Thông cáo Quyền sở hữu trí tuệ:** [`NOTICE`](NOTICE)

---

## 3. Tóm tắt Giấy phép Các Thành phần Cốt lõi

| Thành phần | Vai trò kiến trúc | Phiên bản | Giấy phép | Chuẩn OSI |
|---|---|---|---|:---:|
| **Keycloak** | Định danh tập trung & SSO | 24.0.5 | Apache-2.0 | ✓ |
| **Nginx** | Cổng giao tiếp API Gateway | 1.27 Alpine | BSD-2-Clause | ✓ |
| **PostgreSQL** | Cơ sở dữ liệu quan hệ | 16 Alpine | PostgreSQL License | ✓ |
| **FastAPI** | Backend Microservices | 0.115.0 | MIT | ✓ |
| **React** | Giao diện người dùng Web SPA | 18.3.1 | MIT | ✓ |
| **MinIO** | Lưu trữ tệp đối tượng S3 API | RELEASE.2024+ | AGPL-3.0 | ✓ |
| **Scikit-Learn** | Tác tử AI TF-IDF Vectorizer | 1.4+ | BSD-3-Clause | ✓ |
| **Lucide React** | Bộ biểu tượng giao diện | 0.400+ | ISC | ✓ |
| **Python** | Nền tảng thực thi ngôn ngữ | 3.11 / 3.12 | PSF License | ✓ |
