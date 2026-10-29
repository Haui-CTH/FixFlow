# Hướng dẫn Triển khai Hệ thống FixFlow (Field Service Management)
<!-- SPDX-License-Identifier: Apache-2.0 -->

Tài liệu này cung cấp hướng dẫn triển khai toàn diện nền tảng **FixFlow** từ môi trường phát triển cục bộ (Local Development) đến môi trường máy chủ sản xuất (Production VPS) và môi trường thi đấu / demo công khai trên Internet qua đường hầm **Cloudflare Tunnel**.

```
                           ┌───────────────────────────────┐
                           │   Người dùng / Khách hàng     │
                           └───────────────┬───────────────┘
                                           │ HTTPS (Port 443)
                                           ▼
             ┌───────────────────────────────────────────────────────────┐
             │       LỚP TRUY CẬP CÔNG KHAI (INTERNET EDGE)              │
             │   Tùy chọn A: Cloudflare Tunnel (Không cần mở cổng mạng)  │
             │   Tùy chọn B: VPS Linux + Caddy / Let's Encrypt SSL       │
             └─────────────────────────────┬─────────────────────────────┘
                                           │ HTTP (Nội bộ)
                                           ▼
             ┌───────────────────────────────────────────────────────────┐
             │       FIXFLOW API GATEWAY (Nginx - Port 80)               │
             │   - Điều hướng Single-Origin                              │
             │   - Bảo toàn Header X-Forwarded-Proto / X-Forwarded-Port  │
             └──────┬──────────────────────┬──────────────────────┬──────┘
                    │                      │                      │
        ┌───────────▼─────────┐ ┌──────────▼──────────┐ ┌─────────▼────────┐
        │ Frontend Web App    │ │ Keycloak SSO (Auth) │ │ Ticket Service   │
        │ (React 18 + Vite)   │ │ (Port 8080)         │ │ (Port 8001)      │
        └─────────────────────┘ └─────────────────────┘ └─────────┬────────┘
                                                                  │
                                                        ┌─────────▼────────┐
                                                        │ PostgreSQL 16    │
                                                        │ MinIO S3 Storage │
                                                        │ AI Service       │
                                                        └──────────────────┘
```

---

## 1. Yêu cầu Hệ thống (System Requirements)

FixFlow được tối ưu hóa theo mô hình microservices tinh gọn (Lightweight Open-Core), sử dụng lượng tài nguyên phần cứng thấp hơn rất nhiều so với các hệ thống cồng kềnh khác:

| Thông số | Yêu cầu Tối thiểu | Khuyến nghị Production |
| :--- | :--- | :--- |
| **Hệ điều hành** | Linux (Ubuntu 22.04/24.04 LTS), macOS, Windows 11 WSL2 | Ubuntu 24.04 LTS x86_64 |
| **CPU** | 2 vCPU | 4 vCPU |
| **RAM** | **2.5 GB RAM** (Mức thực tế stack FixFlow chỉ dùng ~1.8 GB) | 4 GB – 8 GB RAM |
| **Ổ cứng** | 15 GB SSD khả dụng | 40 GB NVMe SSD |
| **Phần mềm** | Docker Engine $\ge$ 24.0, Docker Compose v2.20+ | Docker Engine $\ge$ 26.0, Compose v2.27+ |

---

## 2. Phương án 1: Triển khai Internet qua Cloudflare Tunnel (Khuyên dùng cho Cuộc thi & Demo)

Phương án này được thiết kế riêng cho các đội thi và người vận hành muốn đưa toàn bộ hệ thống lên Internet có **tên miền riêng** và **chứng chỉ HTTPS xanh**, mà **không cần thuê VPS có IP tĩnh**, không cần mở cổng modem (Port Forwarding), hoạt động mượt mà trên cả laptop, PC cá nhân hoặc máy ảo sau tường lửa NAT.

### 2.1. Ưu điểm vượt trội
- **Bảo mật Zero-Trust**: Máy chủ/laptop không mở bất kỳ cổng nào ra Internet (kể cả cổng 80 hay 443).
- **Chống DDoS & Web Application Firewall (WAF)**: Lưu lượng được Cloudflare kiểm duyệt trước khi vào máy chủ.
- **Tự động cấp HTTPS**: Toàn quyền sở hữu chứng chỉ SSL/TLS miễn phí từ Cloudflare Edge.
- **Hoạt động tức thì**: Không bị ảnh hưởng bởi nhà mạng chặn cổng HTTP/HTTPS.

### 2.2. Các bước thiết lập

#### Bước 1: Tạo Tunnel trên Cloudflare Zero Trust
1. Đăng nhập trang quản trị [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) (gói Free miễn phí vĩnh viễn).
2. Vào mục **Networks** $\rightarrow$ **Tunnels** $\rightarrow$ Chọn **Create a tunnel**.
3. Chọn loại kết nối **Cloudflared** $\rightarrow$ Đặt tên tunnel (ví dụ: `fixflow-tunnel`) $\rightarrow$ Bấm **Save tunnel**.
4. Tại bước *Install and run a connector*, sao chép chuỗi mã sau tham số `--token` (đây là `CLOUDFLARE_TUNNEL_TOKEN`).

#### Bước 2: Cấu hình biến môi trường FixFlow
Thêm biến `CLOUDFLARE_TUNNEL_TOKEN` vào tệp `.env` của dự án:

```bash
# Thêm token tunnel vừa copy vào file .env
echo "CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoiYmNm..." >> .env
```

#### Bước 3: Khởi chạy cụm dịch vụ kèm Tunnel Overlay
Chạy lệnh Docker Compose kết hợp tệp overlay [`docker-compose.tunnel.yml`](../docker-compose.tunnel.yml):

```bash
docker compose -f docker-compose.yml -f docker-compose.tunnel.yml up -d
```

Kiểm tra container `dxfsm-cloudflared` kết nối thành công:
```bash
docker compose logs cloudflared | grep "Registered tunnel connection"
# Xuất hiện 4 kết nối định tuyến thành công tới các trung tâm dữ liệu của Cloudflare
```

#### Bước 4: Trỏ tên miền (Public Hostname Routing)
Quay lại trang Cloudflare Dashboard trên trình duyệt:
1. Chuyển sang tab **Public Hostnames** (hoặc *Published Application*).
2. Chọn **Add a public hostname**:
   - **Subdomain**: `fixflow` (hoặc tên tùy chọn)
   - **Domain**: chọn tên miền bạn quản lý trên Cloudflare (ví dụ: `yourdomain.com`)
   - **Service Type**: `HTTP`
   - **URL**: `gateway:80`
3. Bấm **Save hostname**.

> 🎉 **Hoàn tất:** Truy cập ngay `https://fixflow.yourdomain.com` trên điện thoại hoặc máy tính của Ban giám khảo. Toàn bộ Web UI, Keycloak SSO và Backend API đều chạy mượt mà dưới giao thức HTTPS chuẩn mực!

---

## 3. Phương án 2: Triển khai Máy chủ VPS Linux Độc lập (Production Dedicated Server)

Dành cho kịch bản triển khai dài hạn trên hạ tầng máy chủ ảo (Hetzner, DigitalOcean, Linode, Vietnix, FPT Cloud,...):

### 3.1. Chuẩn bị máy chủ Ubuntu 24.04 LTS
Kết nối SSH vào máy chủ và cài đặt các gói cần thiết:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git make ufw caddy

# Cài đặt Docker Engine & Docker Compose chính chủ Docker
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Cấu hình tường lửa UFW (Chỉ mở SSH, HTTP 80 và HTTPS 443)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3.2. Lấy mã nguồn và Cấu hình Môi trường
```bash
git clone https://github.com/truong-newbie/PMNM_2026_DX_FSM.git /opt/fixflow
cd /opt/fixflow

# Sao chép và cập nhật file .env với mật khẩu an toàn
cp .env.example .env
nano .env
```

### 3.3. Khởi chạy Hệ sinh thái FixFlow
```bash
docker compose up -d --wait
docker compose ps
```

### 3.4. Cấu hình Reverse Proxy Tự động Cấp HTTPS với Caddy
Chỉnh sửa tệp cấu hình Caddy `/etc/caddy/Caddyfile`:

```caddyfile
fixflow.yourdomain.com {
    reverse_proxy 127.0.0.1:80 {
        header_up X-Forwarded-Port 443
        header_up X-Forwarded-Proto https
    }
}
```

Nạp lại dịch vụ Caddy:
```bash
sudo systemctl reload caddy
sudo journalctl -u caddy -n 20 --no-pager
# Caddy sẽ tự động xác thực tên miền qua ACME và xin chứng chỉ Let's Encrypt trong 5 giây!
```

---

## 4. Kiểm tra Tự động Toàn diện sau khi Triển khai (Automated Smoke Tests)

Sau khi triển khai lên domain công khai (ví dụ `https://fixflow.yourdomain.com`), người vận hành hoặc Ban Giám khảo có thể chạy công cụ kiểm thử tự động toàn diện chỉ bằng một lệnh:

```bash
# Quét tự động 7 hạng mục: TLS, Web UI, Keycloak OIDC, API Gateway, Public Verify, AI KB, Cô lập mạng
python scripts/verify_online_deploy.py https://fixflow.yourdomain.com

# Hoặc dùng Makefile
make verify-online url=https://fixflow.yourdomain.com
```

Hoặc kiểm tra thủ công từng thành phần:

```bash
# 1. Kiểm tra Gateway trả về mã 200/302 chuẩn
curl -sI https://fixflow.yourdomain.com/ | head -n 5

# 2. Kiểm tra OpenID Connect Issuer của Keycloak nhận diện đúng HTTPS
curl -s https://fixflow.yourdomain.com/realms/dx-fsm/.well-known/openid-configuration | grep -oE '"issuer":"[^"]*"'
# Kết quả mong đợi: "issuer":"https://fixflow.yourdomain.com/realms/dx-fsm"

# 3. Kiểm tra API Backend qua Gateway
curl -s https://fixflow.yourdomain.com/api/v1/tickets/stats/summary

# 4. Kiểm tra sức khỏe phân hệ AI & Circuit Breaker
curl -s https://fixflow.yourdomain.com/api/v1/ai/health
```

---

## 5. Sao lưu và Khôi phục Thảm họa (Automated Backup & Disaster Recovery)

Hệ thống FixFlow tích hợp sẵn cơ chế sao lưu định kỳ và khôi phục an toàn có xác thực mã băm mật mã học (SHA-256) nhằm bảo vệ dữ liệu nghiệp vụ và tệp chứng từ hiện trường:

### 5.1. Tạo bản sao lưu (Backup)
```bash
# Tự động trích xuất PostgreSQL, tệp đính kèm và tạo manifest.json kiểm toán SHA-256
make backup
# Hoặc chạy script
python scripts/backup.py --keep 7
```
Bản sao lưu được lưu trữ có đánh dấu thời gian tại `backups/backup_YYYYMMDD_HHMMSS/` với chính sách lưu trữ (retention policy) giữ lại 7 bản gần nhất.

### 5.2. Khôi phục từ bản sao lưu (Restore)
```bash
# Khôi phục từ bản sao lưu mới nhất (tự động kiểm tra SHA-256 chống sửa lén)
make restore

# Khôi phục bản cụ thể và bỏ qua xác nhận tương tác
python scripts/restore.py backup_20261029_053231 --force
```

---

## 6. Danh mục Cổng & Cô lập Mạng (Zero-Trust Network Isolation)

FixFlow áp dụng mô hình bảo mật nhiều lớp:
- **Cổng mở duy nhất ra ngoài**: Cổng **80** (và **443** qua Reverse Proxy).
- **Mạng nội bộ Docker (`dxfsm-net`)**: 
  - `postgres` (5432): Chỉ các microservices trong mạng nội bộ truy cập được.
  - `keycloak` (8080): Định tuyến qua Nginx Gateway, không cần mở trực tiếp cổng 8080.
  - `ai-service` (8002): Định tuyến qua Nginx Gateway.
  - `minio` (9000/9001): Lưu trữ đối tượng nội bộ.
  - `n8n` (5678): Động cơ tự động hóa quy trình.

---

## 7. Xử lý Sự cố Thường gặp (Troubleshooting)

### Q: Keycloak chuyển hướng về `http://` thay vì `https://` sau khi đăng nhập?
**A:** Đảm bảo Gateway Nginx đã bật `map $http_x_forwarded_proto $forwarded_proto` và `KC_PROXY_HEADERS=xforwarded` trên Keycloak container. File cấu hình trong repo đã được cấu hình sẵn tính năng này.

### Q: Đăng nhập báo lỗi `Invalid redirect_uri`?
**A:** Keycloak client `dx-fsm-frontend` trong file `core/keycloak/realm-export.json` đã được cài đặt sẵn redirect URIs dạng wildcard `*` và Web Origins `+`, cho phép nhận diện tự động bất kỳ tên miền hoặc subdomain nào mà không cần cấu hình lại thủ công.

### Q: Muốn chạy demo nhanh trên máy chấm thi của Ban giám khảo?
**A:** Chạy `cloudflared tunnel --url http://localhost:80` trên terminal để có ngay URL HTTPS tạm thời trong 3 giây.
