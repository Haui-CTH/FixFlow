# PostgreSQL Database Schema

## Schema: public

Database `dxfsm` được khởi tạo tự động từ `init.sql` khi container lần đầu chạy.

## Các bảng chính

- `users` – Thông tin user (metadata từ Keycloak)
- `tickets` – Ticket chính
- `ticket_comments` – Bình luận trên ticket
- `ticket_attachments` – File đính kèm
- `ticket_history` – Lịch sử thay đổi trạng thái
- `technicians` – Thông tin KTV mở rộng
- `notifications` – Thông báo

## Seed data

`init.sql` bao gồm 50+ ticket mẫu đa dạng và 3 technician demo.

## Kết nối

```bash
# Từ host
psql -h localhost -p 5432 -U dxfsm -d dxfsm

# Từ container
docker compose exec postgres psql -U dxfsm -d dxfsm
```
