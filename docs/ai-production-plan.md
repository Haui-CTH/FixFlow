# DX-FSM - Kế hoạch đưa AI vào sử dụng thật

## 1. Mục tiêu

Đưa AI từ mức "có code + test" sang mức "được dùng thật trong sản phẩm", không cần
train model mới. Ba luồng cần hoạt động end-to-end:

1. **Tạo ticket**: Ollama phân loại thật, lưu `ai_category`, `ai_priority`,
   `ai_confidence`, `ai_recommendation`; fallback rule-based khi LLM lỗi.
2. **Knowledge Base**: gợi ý bài viết liên quan từ AI service và hiển thị trên UI.
3. **Phân công KTV**: recommender trả KTV thật từ DB, UI dùng kết quả thay vì
   tự chấm điểm phía client.

Nguyên tắc:

- LLM chỉ dùng cho phân loại (và có thể cho solution/summary sau này).
- KB dùng TF-IDF, recommender dùng scoring + collaborative filtering, không cần LLM.
- Khi Ollama hoặc AI service lỗi, hệ thống vẫn tạo ticket và phân công được bằng
  rule-based/heuristic hiện có.

## 2. Hiện trạng và điểm đang chặn

| # | Vấn đề | Vị trí | Ảnh hưởng |
|---|---|---|---|
| 1 | URL/model Ollama hardcode, bỏ qua `OLLAMA_BASE_URL`; gọi HTTP sync trong async; `/health` trả `ollama_available: false` cố định | `services/ai-service/app/services/ai_classifier.py:24`, `services/ai-service/app/routes/health.py:13` | LLM không bao giờ được gọi; health báo sai |
| 2 | Compose không có service Ollama; máy dev chưa cài Ollama | `docker-compose.yml:156` | Mọi request classify rơi vào rule-based |
| 3 | Recommender không được seed lúc startup; seed ID `tech-001` không khớp UUID trong DB | `services/ai-service/app/main.py:13`, `services/ai-service/app/services/recommender_v2.py:283` | `/recommend` trả 0 KTV |
| 4 | KB không có route gateway; frontend không gọi; CRUD chỉ nằm trong RAM | `core/nginx/nginx.conf`, `app/src/lib/api.ts:214` | KB có code nhưng không được dùng |
| 5 | AI service dùng 7 category, DB/UI chỉ có 5 | `services/ticket-service/app/models/enums.py:24`, `core/postgres/init.sql:15` | Gợi ý `access_control`/`service_request` không áp dụng được |
| 6 | Timeout 5 giây dễ rơi vào fallback khi LLM cold start | `services/ticket-service/app/services/ai_classifier.py:185` | Lần đầu phân loại không dùng LLM |
| 7 | Gateway có `/solution`, `/duplicate`, `/summary` nhưng AI service không có endpoint | `core/nginx/nginx.conf:161` | Gọi vào luôn 404 |

## 3. Quyết định cần chốt trước khi triển khai

1. **Cách chạy Ollama**
   - Khuyến nghị: chạy Ollama trên Windows host, dùng GPU nếu có.
   - Phương án khác: thêm service Ollama vào Compose cho máy không cài host.
   - Code phải hỗ trợ cả hai qua `OLLAMA_BASE_URL`.

2. **Category**
   - Khuyến nghị: mở rộng lên 7 category để khớp KB/recommender seed.
   - Phương án nhanh: map `access_control -> hardware`,
     `service_request -> other` và ghi rõ là giải pháp tạm.

3. **Phạm vi**
   - MVP: phân loại thật + phân công thật.
   - Đầy đủ: thêm KB trên UI, metrics, feedback, dọn endpoint chết.

## 4. Kế hoạch triển khai

### P0 - Chốt cách chạy Ollama (0.5 ngày)

Việc cần làm:

- Cài Ollama trên host (Windows):

  ```powershell
  winget install Ollama.Ollama
  ollama pull llama3.2:3b
  ollama serve
  ```

- Cân nhắc benchmark thêm `qwen2.5:3b` cho tiếng Việt.
- Thêm biến môi trường vào `.env.example`:

  ```dotenv
  OLLAMA_BASE_URL=http://host.docker.internal:11434
  OLLAMA_MODEL=llama3.2:3b
  OLLAMA_TIMEOUT=60
  OLLAMA_KEEP_ALIVE=30m
  ENABLE_AI=true
  AI_CLASSIFY_TIMEOUT=30
  ```

- Kiểm tra từ trong container:

  ```bash
  docker compose exec ai-service \
    python -c "import httpx; print(httpx.get('http://host.docker.internal:11434/api/tags').json())"
  ```

**Done:** container gọi được Ollama và thấy model trong `/api/tags`.

### P1 - AI service dùng LLM thật (1 ngày)

Việc cần làm:

- `config.py`: dùng `Settings` cho URL, model, timeout, `enable_ai`,
  `keep_alive`; xóa hardcode.
- `ai_classifier.py`:
  - Chuyển sang `httpx.AsyncClient`.
  - Gọi `POST {OLLAMA_BASE_URL}/api/generate`.
  - Validate output: category thuộc allowlist, priority thuộc enum,
    confidence chuẩn hóa 0-100.
  - Bóc code fence ```json nếu model trả về.
  - Log rõ `ai` / `fallback` / `cached`.
- `health.py`: gọi `/api/tags`, kiểm tra model tồn tại; trả `ok/degraded`,
  không làm container unhealthy khi Ollama chết vì fallback vẫn hoạt động.
- `main.py`: warm-up model ở background và seed recommender khi startup.
- `services/ticket-service/app/services/ai_classifier.py`: timeout cấu hình được,
  không ghi đè `method` của AI service.
- Test: mock Ollama thành công, timeout, JSON lỗi, model trả category lạ.

**Done:**

- `/classify` trả `method: "ai"` khi Ollama chạy.
- Tắt Ollama: `/classify` vẫn trả kết quả rule-based trong timeout cấu hình.
- `/health` phân biệt được `ok` và `degraded`.

### P2 - Compose và vận hành (0.5 ngày)

Việc cần làm:

- Thêm `extra_hosts: ["host.docker.internal:host-gateway"]` cho Linux.
- Tùy chọn thêm service `ollama` + volume + healthcheck + job pull model
  cho máy không cài Ollama host.
- Thêm Makefile target: `ai-up`, `ai-pull`, `ai-smoke`.
- Cập nhật README/deployment: yêu cầu RAM/disk, cách pull model, cách chuyển
  giữa host mode và container mode.

**Done:** `docker compose up -d --build` chạy sạch; smoke test classify qua
gateway hoạt động.

### P3 - Đồng bộ category (0.5-1 ngày)

Việc cần làm:

- Khuyến nghị mở rộng 7 category:
  `hardware`, `software`, `network`, `electrical`, `access_control`,
  `service_request`, `other`.
- Thêm migration `ALTER TYPE ticket_category ADD VALUE ...`.
- Cập nhật:
  - `services/ticket-service/app/models/enums.py`
  - `core/postgres/init.sql`
  - `app/src/lib/ticket-meta.ts`
  - i18n, filter, test liên quan.
- Nếu chọn giải pháp tạm: map 2 category mới về category cũ ngay tại AI service
  và ghi chú rõ.

**Done:** category AI trả về luôn áp dụng được vào form và insert DB thành công,
không lỗi enum.

### P4 - Recommender dùng dữ liệu thật (1.5-2 ngày)

Việc cần làm:

- Sửa startup seed đúng format; bỏ seed ID giả.
- Đồng bộ KTV thật từ `technicians` + `users` + load ticket:
  - UUID thật
  - `specialty`
  - `experience_years` -> level
  - `current_load`
  - `is_available`
- Chọn một hướng sync:
  - Ticket-service expose internal endpoint để AI service pull; hoặc
  - Ticket-service push sang AI service khi startup/assign/resolve.
- Thêm service token cho call nội bộ.
- Frontend:
  - Thêm `aiApi.recommend()`.
  - `AssignModal` gọi API, hiển thị top 3 kèm score/lý do.
  - Giữ heuristic hiện tại làm fallback khi AI lỗi.
  - Không auto-assign; chỉ prefill/top suggestion.
- Feedback: khi ticket resolved/closed, gọi `/recommend/feedback` để cập nhật
  metrics (hoặc gửi qua outbox).

**Done:**

- `/recommend` trả đúng KTV có trong DB.
- Assign modal hiển thị gợi ý từ AI service.
- Tắt AI service, modal vẫn hoạt động với heuristic cũ.

### P5 - KB dùng thật trên UI (1 ngày)

Việc cần làm:

- Thêm route gateway/APISIX `/api/v1/kb/` -> `ai-service:8002/kb/`.
- Thêm `aiApi.searchKb` và type tương ứng.
- `TicketCreate`: debounce sau khi nhập title/description, hiển thị top 3 bài.
- `TicketDetail`: card "Bài viết liên quan".
- Cho phép chèn nội dung bài viết vào mô tả/comment nếu phù hợp.
- Persist article ra volume/DB nếu mở CRUD; nếu không, ghi rõ seed là read-only.

**Done:** UI hiển thị bài KB lấy từ `/kb/search`; có test component và smoke test.

### P6 - Dọn dẹp và hardening (1 ngày)

Việc cần làm:

- Triển khai hoặc xóa `/solution`, `/duplicate`, `/summary`.
- Bảo vệ AI service:
  - Không expose port 8002 ra ngoài ở production.
  - Thêm auth/service token cho endpoint nội bộ.
- Metrics/log:
  - Đếm `ai` vs `fallback`.
  - Latency classify/recommend.
  - Tỉ lệ JSON lỗi.
- Cập nhật test, docs, troubleshooting.

**Done:** không còn endpoint quảng cáo nhưng 404; metrics phản ánh đúng;
test suite xanh.

## 5. Ưu tiên và thời lượng

| Phạm vi | Phase | Thời lượng | Kết quả |
|---|---|---|---|
| MVP | P0 + P1 + P3 + P4 | 3.5-4.5 ngày | Phân loại thật + phân công thật |
| Đầy đủ | P0-P6 | 6-7 ngày | Thêm KB UI, metrics, feedback, dọn endpoint |

Thời lượng tính cho 1 dev, chưa gồm thời gian tải model (~2 GB) và thời gian
benchmark chất lượng tiếng Việt.

## 6. Definition of Done

- [ ] `/api/v1/classify` trả `method: "ai"` khi Ollama hoạt động.
- [ ] Tắt Ollama, tạo ticket vẫn thành công bằng fallback.
- [ ] `/health` báo đúng trạng thái LLM, không chặn fallback.
- [ ] `/api/v1/recommend` trả KTV thật từ DB, không phải seed giả.
- [ ] Assign modal hiển thị gợi ý AI và vẫn dùng được khi AI lỗi.
- [ ] UI hiển thị bài KB liên quan lấy từ AI service.
- [ ] Không còn category AI không hợp lệ với DB/UI.
- [ ] Không còn route `/solution`, `/duplicate`, `/summary` trả 404.
- [ ] Test backend/frontend xanh; smoke test Docker Compose chạy qua.

## 7. Rủi ro và giảm thiểu

| Rủi ro | Giảm thiểu |
|---|---|
| Model 3B trên CPU chậm 2-10 giây/lần | Warm-up, `keep_alive`, timeout hợp lý, log latency |
| Llama 3.2 phân loại tiếng Việt chưa tốt | Benchmark 30-50 ticket, cân nhắc `qwen2.5:3b` |
| Cold start làm request đầu timeout | Warm-up sau startup; timeout 30-60s; fallback ngay khi lỗi |
| Seed ID không khớp DB | Sync UUID thật từ ticket-service; không dùng seed ID giả |
| Migration enum lỗi trên DB cũ | Migration riêng, test trên DB mới và DB có dữ liệu |
| FE và ticket-service gọi AI 2 lần | Chấp nhận ở MVP; sau đó thống nhất cache/nguồn |
| AI service hở port, không auth | Chỉ expose nội bộ; thêm service token ở P6 |
| Ollama chiếm RAM/disk | Ghi rõ yêu cầu; dùng host mode hoặc profile riêng |

## 8. Thứ tự commit đề xuất

1. `chore(ai): add Ollama runtime configuration`
2. `fix(ai): call Ollama via configured URL and async client`
3. `feat(ai): report real Ollama health and warm up model`
4. `fix(ai): seed recommender on startup`
5. `feat(db): add access_control and service_request categories`
6. `feat(ai): sync real technicians into recommender`
7. `feat(app): use AI recommender in assign modal`
8. `feat(app): show KB suggestions on ticket create/detail`
9. `chore(gateway): expose KB routes and remove dead AI routes`
10. `test(ai): cover Ollama fallback, seeding and real technician sync`

## 9. Ngoài phạm vi

- Train/fine-tune model riêng.
- HTTPS, HA, autoscaling cho AI service.
- Xếp hàng inference cho nhiều người dùng đồng thời.
- Chấm điểm chất lượng tự động bằng LLM judge.
- Đồng bộ satisfaction rating nếu DB chưa có dữ liệu.
