# APISIX API Gateway Configuration

## Mục đích

APISIX đóng vai trò API Gateway cho DX-FSM:
- Xác thực JWT từ Keycloak
- Rate limiting
- Routing đến các service
- Load balancing

## Cấu hình

- `config.yaml` – Cấu hình APISIX core
- `routes.yaml` – Định nghĩa routes

## Routes chính

| Path | Service | Mô tả |
|---|---|---|
| `/api/v1/tickets/*` | ticket-service:8001 | Ticket CRUD |
| `/api/v1/users/*` | ticket-service:8001 | User management |
| `/api/v1/classify/*` | ai-service:8002 | AI classification |
| `/api/v1/recommend/*` | ai-service:8002 | AI recommendation |
| `/api/v1/notifications/*` | notification-service:8003 | Notifications |

## Admin API

Admin API mặc định bị disable từ bên ngoài (chỉ truy cập được từ trong container hoặc qua Docker network).

## Kiểm tra

```bash
# Health check
curl http://localhost:9180/apisix/admin/health

# List routes
curl -X GET http://localhost:9180/apisix/adminRoutes \
  -H "X-API-KEY: ${APISIX_ADMIN_KEY}"
```
