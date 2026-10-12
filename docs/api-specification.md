# DX-FSM API Specification

## Base URL

```
http://localhost:9180/api/v1
```

## Authentication

Sử dụng JWT Bearer token từ Keycloak:

```
Authorization: Bearer <access_token>
```

## Endpoints

### Health

```
GET /health
Response: { "status": "healthy" }
```

### Tickets

```
GET  /tickets
GET  /tickets/:id
POST /tickets
PATCH /tickets/:id
DELETE /tickets/:id
```

#### List Tickets

```
GET /tickets?status=new&priority=high&limit=50&offset=0

Response 200:
[
  {
    "id": "uuid",
    "ticket_number": "TKT-2025-000001",
    "title": "Tiêu đề ticket",
    "description": "Mô tả...",
    "category": "hardware",
    "priority": "high",
    "status": "new",
    "customer_name": "Khách Hàng Demo",
    "technician_name": null,
    "created_at": "2025-01-15T10:30:00Z",
    "sla_deadline": "2025-01-16T10:30:00Z"
  }
]
```

#### Create Ticket

```
POST /tickets
Content-Type: application/json

{
  "title": "Máy in không hoạt động",
  "description": "Đèn báo nhấp nháy cam",
  "category": "hardware",
  "priority": "medium",
  "customer_name": "Nguyễn Văn A",
  "customer_email": "nv-a@company.vn",
  "customer_phone": "0901234567",
  "customer_location": "Tòa A, Tầng 3"
}

Response 201:
{
  "id": "uuid",
  "ticket_number": "TKT-2025-000051"
}
```

### Users

```
GET /users/me
GET /users/technicians
```

### AI Classification

```
POST /api/v1/classify
Content-Type: application/json

{
  "title": "Máy tính không bật được",
  "description": "Đã thử cắm nguồn nhiều lần"
}

Response 200:
{
  "category": "hardware",
  "priority": "high",
  "confidence": 92.5,
  "recommendation": "Gửi đến bộ phận hardware"
}
```

## Error Responses

```json
{
  "error": "Error code",
  "message": "Human-readable message",
  "details": {}
}
```

| Status | Meaning |
|---|---|
| 400 | Bad Request – validation error |
| 401 | Unauthorized – missing/invalid token |
| 403 | Forbidden – insufficient permissions |
| 404 | Not Found |
| 429 | Too Many Requests – rate limit exceeded |
| 500 | Internal Server Error |
