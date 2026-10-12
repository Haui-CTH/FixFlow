# DX-FSM Architecture Document

## 1. Tổng quan

DX-FSM (Digital Transformation Field Service Management) là nền tảng quản lý dịch vụ thực địa được thiết kế theo mô hình Open-Core với 4 tầng nghiệp vụ.

## 2. Mô hình 4 tầng

### Tầng 1: Open-Core (Infrastructure)
Cung cấp các service nền tảng, không có UI người dùng.

- **Keycloak**: Identity Provider, SSO, Role-Based Access Control
- **APISIX**: API Gateway, authentication, rate limiting, routing
- **PostgreSQL**: Primary database, JSONB support
- **MinIO**: Object storage cho file đính kèm
- **n8n**: Workflow automation engine

### Tầng 2: H-P-D-I (Service Tier)
Các microservice xử lý nghiệp vụ chính.

```
ticket-service          → Core CRUD, business logic
  ├─ Ticket management (create, update, status transitions)
  ├─ User/Tech management
  ├─ SLA calculation
  ├─ MinIO integration (file upload)
  └─ Audit logging

ai-service             → AI-powered features
  ├─ Rule-based classification (keyword matching)
  ├─ Ollama LLM integration (optional)
  ├─ Technician recommendation
  └─ Priority detection

notification-service    → Multi-channel notifications
  └─ Future: Email, SMS, Push
```

### Tầng 3: User Interface
React SPA với TanStack Query, React Router, Zustand.

- **Dashboard**: KPI, thống kê real-time
- **Tickets**: CRUD interface với filter, search, pagination
- **Profile**: Thông tin user, settings

### Tầng 4: Intelligence
Các module AI/ML tùy chọn.

- Rule-based classifier (luôn bật)
- Ollama LLM integration (tùy chọn)
- RAG cho knowledge base (tương lai)

## 3. Data Model

```
┌─────────────┐     ┌─────────────┐
│   users     │────<│ technicians  │
│ (Keycloak) │     │ (extended)   │
└─────────────┘     └──────────────┘
       │
       │ creates
       ▼
┌─────────────────────────────────────┐
│             tickets                 │
│ (core entity)                      │
├─────────────────────────────────────┤
│ Comments │ Attachments │ History   │
└─────────────────────────────────────┘
```

## 4. Security

- **Authentication**: Keycloak OpenID Connect
- **Authorization**: Role-based (admin, manager, technician, customer)
- **API Security**: JWT validation tại APISIX gateway
- **Data**: TLS in transit, encrypted volumes at rest

## 5. Scalability

- **Stateless services**: Mỗi service có thể scale horizontal
- **Database**: PostgreSQL connection pooling
- **Caching**: APISIX proxy cache cho read-heavy endpoints
- **Object storage**: MinIO distributed mode cho production

## 6. Deployment

Single-node Docker Compose cho development và demo.
Multi-node Kubernetes cho production (tương lai).
