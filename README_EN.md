# DX-FSM – Field Service Management Platform

**Field Service Management Platform on DX-OS Open-Core**

![Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ed)
![Python](https://img.shields.io/badge/Python-3.11+-3776ab)
![Vue](https://img.shields.io/badge/Vue-3-4fc08d)

## Overview

DX-FSM is a Field Service Management system built on **DX-OS Open-Core 3-tier architecture**:

- **Tier 1 – Open-Core (Headless):** Keycloak, APISIX, PostgreSQL, MinIO, n8n
- **Tier 2 – H-P-D-I:** Human, Process, Data, Intelligence spaces
- **Tier 3 – Application:** Vue 3 SPA for Customer, Technician, Manager

## Quick Start

```bash
git clone https://github.com/<team>/dx-fsm.git
cd dx-fsm
cp .env.example .env
docker compose up -d
```

Access: <https://fixflow.filebridge.click> (or local `http://localhost/`)  
Public Verification: <https://fixflow.filebridge.click/verify/TKT-2026-000003>

## Demo Accounts

| Role | Username | Password |
|---|---|---|
| Customer | `customer@haui.vn` | `customer123` |
| Technician | `technician@haui.vn` | `tech123` |
| Manager | `manager@haui.vn` | `manager123` |
| Admin | `admin@haui.vn` | `admin123` |

## License

Apache License 2.0 – See [LICENSE](LICENSE)
