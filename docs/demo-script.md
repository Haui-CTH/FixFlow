# Kịch bản demo frontend (3–5 phút, 3 vai trò)

Chuẩn bị (trước buổi demo):

1. `docker compose up -d --build` rồi mở `http://localhost:3000` (không dùng cổng 80 nếu máy có WSL, xem `app/README.md`).
2. Kiểm tra cả ba tài khoản đăng nhập được: `manager`, `technician`, `customer` (realm `dx-fsm`; `customer` cần đặt mật khẩu trong Keycloak nếu còn mật khẩu tạm).
3. **Backup**: `docker compose cp app:/usr/share/nginx/html ./dist-backup` (bản build production đang chạy) và ảnh trong `docs/screenshots/`.
4. Mở sẵn hai cửa sổ ẩn danh khác nhau để đăng nhập hai vai trò song song (SSO chia sẻ cookie trong cùng một cửa sổ).

## Luồng (khoảng 4 phút)

| Phút | Vai trò | Thao tác | Điểm cần nói |
|---|---|---|---|
| 0:00 | — | Mở trang Login → bấm **VI \| EN** → quay về VI | Giao diện hai ngôn ngữ, đổi tức thì; nút SSO duy nhất |
| 0:30 | **customer** | Đăng nhập → **Tạo ticket**: gõ tiêu đề/mô tả → **Gợi ý bằng AI** → chỉnh nếu cần → đính kèm ảnh → Tạo | AI gợi ý danh mục/ưu tiên (tự điền khi tin cậy > 70%), vẫn sửa được; validation và `ErrorSummary` |
| 1:15 | **manager** | Đăng nhập → **Tổng quan** (KPI, SLA gauge, Outbox) → **Tất cả ticket** (lọc/sắp xếp/tìm) → mở ticket mới | Dashboard theo thời gian thực (tự làm mới 30s); bộ lọc lưu trên URL |
| 2:00 | **manager** | Bấm **Phân công** → chọn KTV (thanh tải, "Đề xuất") → xác nhận | Gợi ý KTV theo chuyên môn và tải; thông báo gửi tới KTV |
| 2:30 | **technician** | Đăng nhập → chuông thông báo hiện số → mở thông báo → **Bắt đầu xử lý** → thêm ghi chú nội bộ → **Đã giải quyết** | Chỉ thấy hành động hợp lệ; ghi chú nội bộ khách không thấy; cập nhật lạc quan |
| 3:30 | **customer** | Chuông báo "Đã giải quyết" → mở ticket → **Xác nhận & đóng ticket** | Khách xác nhận đóng; lịch sử đầy đủ ở tab **Lịch sử** |
| 4:00 | bất kỳ | Bật giao diện tối; thu nhỏ cửa sổ xuống 375px | Dark mode, responsive (bảng → card, thanh hành động dính đáy) |

## Nếu có sự cố

- Màn hình trắng / lỗi lazy chunk sau khi build lại: tải lại trang (Ctrl+Shift+R).
- Đăng nhập lặp: kiểm tra `http://localhost:8080` (Keycloak) và redirect URI `http://localhost:3000/*`.
- `Outbox lỗi` trên Dashboard > 0 là do n8n chưa chạy workflow; không ảnh hưởng luồng demo.
- Dự phòng: dùng ảnh trong `docs/screenshots/` hoặc `dist-backup/`.
