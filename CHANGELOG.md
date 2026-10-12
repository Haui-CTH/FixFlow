# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [v1.0.0] – YYYY-MM-DD

### Added

- Initial release
- DX-OS Open-Core architecture (3-tier)
  - Keycloak for Identity/SSO
  - Apache APISIX for API Gateway
  - PostgreSQL for structured data
  - MinIO for file storage
  - n8n for workflow automation
- Ticket Service API (FastAPI)
  - CRUD operations for tickets
  - User management integration
  - File upload via MinIO
- AI Service
  - Ticket classification (Ollama/Llama 3.2)
  - Technician recommendation
  - Rule-based fallback
- Vue 3 Frontend Application
  - Customer portal (create/track tickets)
  - Technician portal (process tickets)
  - Manager dashboard (KPI/analytics)
- H-P-D-I implementation
  - H: User profiles and authentication
  - P: Complete ticket workflow
  - D: Real-time dashboard and reports
  - I: AI-powered classification and recommendations
- Docker Compose orchestration
- Documentation (Docusaurus)
- GitHub Actions CI/CD pipeline
- Open-source compliance (Apache-2.0)

### Features

- [x] SSO authentication via Keycloak
- [x] Role-based access control (customer/technician/manager/admin)
- [x] Ticket lifecycle management
- [x] Automatic ticket classification using AI
- [x] Technician recommendation engine
- [x] File attachment upload
- [x] Real-time dashboard
- [x] SLA monitoring
- [x] Notification system
- [x] Fallback for AI service unavailability

---

## [v0.0.1] – YYYY-MM-DD

### Added

- Project scaffolding
- Initial repository structure
- Development environment setup
