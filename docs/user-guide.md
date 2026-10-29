# DX-FSM User Guide

## Giới thiệu

DX-FSM là nền tảng quản lý dịch vụ thực địa (Field Service Management) giúp tự động hóa quy trình tiếp nhận, phân loại và xử lý yêu cầu từ khách hàng.

## Các vai trò

| Vai trò | Mô tả |
|---|---|
| **Admin** | Quản trị hệ thống |
| **Manager** | Quản lý team, theo dõi dashboard |
| **Technician** | Tiếp nhận và xử lý ticket |
| **Customer** | Tạo yêu cầu hỗ trợ |

## Quy trình xử lý ticket

```
1. Customer tạo ticket → AI tự động phân loại (category, priority)
2. AI gợi ý KTV phù hợp → Manager giao ticket
3. KTV nhận và xử lý → Cập nhật trạng thái
4. Hoàn thành → Customer xác nhận đóng ticket
```

## Tạo ticket mới

1. Đăng nhập → vào **Tickets**
2. Click **+ Tạo Ticket**
3. Điền thông tin:
   - Tiêu đề (bắt buộc)
   - Mô tả chi tiết vấn đề
   - Danh mục (7 danh mục: hardware, software, network, electrical, access_control, service_request, other)
   - Mức ưu tiên
   - Thông tin liên hệ
4. Submit → Ticket được tạo + AI phân loại tự động

## Trạng thái ticket

| Trạng thái | Màu | Ý nghĩa |
|---|---|---|
| Mới | Xanh dương | Chờ tiếp nhận |
| Đã giao | Tím | Đã gán cho KTV |
| Đang xử lý | Cam | KTV đang làm |
| Chờ | Xám | Chờ phản hồi/thông tin |
| Đã giải quyết | Xanh lá | Xong chờ đóng |
| Đã đóng | Đen | Hoàn tất |
| Đã hủy | Đỏ | Hủy bỏ |

## SLA

| Mức ưu tiên | Thời gian xử lý |
|---|---|
| Critical | 4 giờ |
| High | 24 giờ |
| Medium | 72 giờ |
| Low | 168 giờ (7 ngày) |

## AI Features

- **Auto-classification**: Tự động phân loại 7 danh mục sự cố và 4 mức ưu tiên với bộ chuẩn hóa tiếng Việt, độ chính xác **99.00%** (198/200 mẫu), độ trễ < 0.2ms trên CPU.
- **Privacy Assurance (PDPD)**: Tự động phát hiện và che giấu SĐT, Email, CCCD, và Họ tên người Việt theo Nghị định 13/2023/NĐ-CP.
- **Knowledge Base Assistance**: Tra cứu cẩm nang giải pháp sự cố theo thời gian thực (Semantic Query Expansion + TF-IDF) và chèn giải pháp 1-click.
- **Explainable AI (XAI)**: Gợi ý Kỹ thuật viên kèm phân tách minh bạch từng thành phần điểm số (chuyên môn, đánh giá, tải việc, kỹ năng).

## Dashboard

Dashboard hiển thị:
- Tổng số ticket theo trạng thái
- Ticket quá hạn SLA
- Thời gian xử lý trung bình
- Tải của từng KTV

## Demo Credentials

| User | Password | Role |
|---|---|---|
| admin | admin123 | Admin |
| manager | manager123 | Manager |
| technician | tech123 | Technician |
| customer | customer123 | Customer |
