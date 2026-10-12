# n8n Workflows

## Giới thiệu

n8n là workflow engine cho Tầng 2 – Process (H-P-D-I).

## Workflows

### 1. ticket-intake
Kích hoạt khi có ticket mới → gọi AI classify → log

### 2. ticket-assign
Kích hoạt sau khi AI classify → gán KTV → gửi notification

### 3. sla-monitor
Chạy định kỳ → kiểm tra SLA → cảnh báo nếu quá hạn

## Truy cập

- **URL:** http://localhost:5678
- **Credentials:** admin / changeme_n8n_123

## Import workflow

Vào n8n → Settings → Import → paste JSON từ file trong thư mục `workflows/`
