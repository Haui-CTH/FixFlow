# Chính sách Bảo mật (Security Policy)

FixFlow quản lý các thông tin kỹ thuật, hồ sơ sự cố hiện trường và phiên đăng nhập của người dùng. Nếu bạn phát hiện một lỗ hổng bảo mật, xin vui lòng báo cáo **riêng tư** cho đội ngũ duy trì theo hướng dẫn dưới đây — vui lòng không mở issue, pull request hoặc thảo luận công khai về lỗ hổng.

---

## 1. Phiên bản được hỗ trợ

| Phiên bản | Nhận bản vá bảo mật | Ghi chú |
| :--- | :---: | :--- |
| **v1.3.x** (nhánh `main`, `master`) | ✅ Có | Bản phát hành chính thức OLP PMNM 2026 |
| `develop` | ✅ Có | Nhánh tích hợp tính năng |
| Các bản cũ hơn (< v1.3.0) | ❌ Không | Vui lòng nâng cấp lên phiên bản mới nhất |

---

## 2. Cách thức báo cáo lỗ hổng

Vui lòng sử dụng tính năng **Báo cáo lỗ hổng riêng tư** (*Private Vulnerability Reporting*) của GitHub:

1. Mở tab **Security** của kho lưu trữ: [FixFlow Security Advisories](https://github.com/truong-newbie/PMNM_2026_DX_FSM/security/advisories/new)
2. Bấm chọn **Report a vulnerability**.
3. Điền mô tả chi tiết kèm các bước tái hiện lỗi. Chỉ người báo cáo và nhóm quản trị dự án có thể đọc được nội dung này.

Nếu không thể truy cập giao diện trên, vui lòng gửi email trực tiếp tới:
- **Đại diện kỹ thuật:** Đỗ Đăng Trường (<dangtruong3122005@gmail.com>)
- Tiêu đề email: `[FIXFLOW-SECURITY] Báo cáo lỗ hổng bảo mật - <Tên thành phần>`

---

## 3. Nội dung cần cung cấp

Để hỗ trợ xử lý nhanh chóng, vui lòng cung cấp:
- Thành phần bị ảnh hưởng (Keycloak Gateway, Ticket Service, AI Service, Frontend SPA).
- Phiên bản hoặc mã băm commit (`git rev-parse HEAD`).
- Kịch bản tái hiện ngắn gọn (Proof-of-Concept), log lỗi nếu có. **Tuyệt đối không đính kèm mật khẩu thật hoặc token phiên thật.**
- Đánh giá sơ bộ về mức độ tác động và phạm vi ảnh hưởng.

---

## 4. Cam kết thời gian phản hồi

Đội ngũ FixFlow cam kết quy trình tiếp nhận và xử lý sự cố bảo mật:

| Giai đoạn | Thời gian phản hồi mục tiêu |
| :--- | :--- |
| **Xác nhận tiếp nhận báo cáo** | Trong vòng **24 - 48 giờ** |
| **Thẩm định & đánh giá mức độ rủi ro** | Trong vòng **3 - 5 ngày** |
| **Phát hành bản vá sửa lỗi (Hotfix)** | **7 - 14 ngày** (tùy mức độ nghiêm trọng) |

---

## 5. Quy chế Quản lý Bí mật & Khóa bảo mật

Xem chi tiết quy chuẩn kiểm soát mã khóa bí mật, biến môi trường và quy trình xoay vòng khóa (Rotation) tại [`docs/SECURITY.md`](docs/SECURITY.md).

