# AI Service Sprint 5 — Kế hoạch chi tiết

> **Owner:** AI Dev
> **Phạm vi sở hữu:** `services/ai-service/**`, `core/n8n/workflows/**`
> **Trạng thái tham chiếu:** sau Sprint 4, develop HEAD `f2a911b`

---

## 0. Quy tắc cá nhân

- Mỗi model/rule thay đổi có test (pytest + sample inputs).
- Confidence score phải deterministic (cùng input → cùng output).
- Model prompts versioned trong `app/prompts/`.
- Push qua `./scripts/git-sync.sh push`.
- Cuối ngày có 1 commit `chore(ai): daily-log ngày N`.

---

## 1. Tổng quan Sprint 5

| Mục tiêu | Loại | Effort |
|---|---|---|
| A5.1 Tăng accuracy classifier (sample data) | ML | 4h |
| A5.2 Embeddings + semantic search cho KB | Feature | 6h |
| A5.3 Recommendation engine v2 (collaborative) | Feature | 4h |
| A5.4 Outbox event consumer (n8n workflow) | Integration | 2h |
| A5.5 Model evaluation script | Tooling | 2h |
| A5.6 n8n workflow: ticket-routing.json | Automation | 2h |

Tổng: ~20h (≈ 3 ngày)

---

## 2. Hiện trạng AI service

**3 routes:**

| Method | Path | Mô tả |
|---|---|---|
| POST | `/classify` | Category + priority từ title/description |
| POST | `/recommend` | Top 3 technicians cho ticket |
| GET | `/health` | Health check |

**Cấu trúc file:**

```
services/ai-service/app/
├── main.py
├── config.py
├── routes/
│   ├── classify.py
│   ├── recommend.py
│   └── health.py
├── services/
│   ├── ai_classifier.py     # Ollama LLM + cache + rule-based fallback
│   ├── rule_classifier.py   # keyword matching
│   └── recommender.py       # technician scoring
├── prompts/
│   └── classify_v1.txt
└── tests/
    ├── test_classify.py
    └── test_recommend.py
```

**Sprint 4 đã có:** cache (hash title+desc), hybrid (AI → rule-based fallback), confidence scale 0-100/0-1.

---

## 3. Backlog chi tiết

### A5.1 — Tăng accuracy classifier

**Mục tiêu:** Từ baseline ~75% → 85%+ accuracy trên test set 200 mẫu.

**Approach:**

1. Tạo `tests/fixtures/ticket_samples.csv` (200 mẫu tiếng Việt, đã label)
2. Viết `scripts/eval_classifier.py`:
   - Loop qua từng sample
   - Gọi `/classify`
   - So sánh với ground truth
   - Report: accuracy, precision/recall per category, confusion matrix
3. Phân tích confusion matrix → biết category nào hay nhầm
4. Cải thiện:
   - Thêm keyword vào `rule_classifier.py`
   - Refine prompt trong `prompts/classify_v1.txt`
   - Hoặc: thêm few-shot examples vào prompt

**Sample format:**

```csv
id,title,description,expected_category,expected_priority
1,Máy in không in được,Đèn báo đỏ nhấp nháy,hardware,high
2,Phần mềm kế toán lỗi,Không vào được màn hình chính,software,medium
...
```

**Acceptance criteria:**

- [ ] Eval script chạy được, output JSON report
- [ ] Baseline đo được
- [ ] Sau optimize, accuracy ≥ 85%
- [ ] Commit report vào `docs/ai-evaluation-sprint5.md`

---

### A5.2 — Embeddings + semantic search

**Mục tiêu:** Tìm ticket tương tự (similar past tickets) dựa trên semantic.

**Approach:**

1. Dùng Ollama embeddings (`nomic-embed-text` hoặc `mxbai-embed-large`)
2. Hoặc: TF-IDF fallback (không cần external)
3. Store embeddings trong Postgres column `embedding VECTOR(768)` (pgvector)
4. Endpoint mới: `POST /similar` — tìm top 5 tickets tương tự

**File mới:**

- `services/ai-service/app/services/embedder.py`
- `services/ai-service/app/routes/similar.py`
- `core/postgres/migrations/001_add_pgvector.sql`
- `core/postgres/init.sql` — update

**API:**

```json
POST /similar
{
  "title": "...",
  "description": "...",
  "limit": 5
}

Response:
{
  "matches": [
    {
      "ticket_id": "uuid",
      "ticket_number": "TKT-2026-000045",
      "similarity": 0.87,
      "title": "..."
    }
  ]
}
```

**Acceptance criteria:**

- [ ] pgvector extension enabled
- [ ] Embedder dùng Ollama (fallback TF-IDF)
- [ ] `/similar` trả về matches với similarity > 0.5
- [ ] Test với 10 sample pairs
- [ ] Performance: < 500ms cho 1 query

---

### A5.3 — Recommendation engine v2

**Hiện trạng:** Recommendation dựa trên:
- Specialty match
- Current active ticket count
- Average rating

**Sprint 5: Thêm collaborative filtering.**

**Approch:**

1. Tính "skill vector" cho mỗi technician (từ past resolved tickets)
2. Tính "ticket vector" (category one-hot + priority)
3. Cosine similarity giữa ticket vector và skill vector
4. Kết hợp: 0.5 × specialty + 0.3 × skill + 0.2 × availability

**File thay đổi:**

- `services/ai-service/app/services/recommender.py` — v2 algorithm
- `services/ai-service/tests/test_recommend.py` — test cases mới

**Acceptance criteria:**

- [ ] Recommender v2 trả top 3 với score breakdown
- [ ] Test: ticket hardware + high priority → recommend technicians có specialty hardware
- [ ] Test: ticket ít past data → fallback về v1
- [ ] Test: technician full slot → giảm score

---

### A5.4 — Outbox event consumer (n8n workflow)

**Mục tiêu:** n8n workflow nhận event từ outbox dispatcher, xử lý business logic.

**Hiện trạng:** `core/n8n/workflows/` rỗng.

**Workflows cần tạo:**

```
core/n8n/workflows/
├── ticket-created.json         # Khi ticket mới tạo → notify customer + manager
├── ticket-status-changed.json  # Khi status change → notify relevant parties
├── sla-breached.json           # Khi SLA breach → alert manager
└── tech-assigned.json          # Khi technician được assign → notify tech
```

**Workflow structure (n8n format):**

```json
{
  "name": "ticket-created",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": { "path": "ticket-created", "httpMethod": "POST" }
    },
    {
      "name": "Notify Customer",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": { "url": "http://ticket-service:8001/internal/notify" }
    },
    {
      "name": "Notify Manager",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": { "url": "http://notification-service:8003/notify" }
    }
  ]
}
```

**Acceptance criteria:**

- [ ] 4 workflow files hợp lệ (import vào n8n không lỗi)
- [ ] Webhook path đúng convention
- [ ] Test import qua `n8n import:workflow --input=file.json`
- [ ] Document trong `docs/n8n-workflows.md`

---

### A5.5 — Model evaluation script

**Mục tiêu:** Tooling để đo accuracy classifier, regression detect.

**File mới:** `services/ai-service/scripts/eval_classifier.py`

**Features:**

- Load test set từ `tests/fixtures/ticket_samples.csv`
- Loop call `/classify`
- Compute metrics:
  - Accuracy
  - Precision/Recall/F1 per category
  - Confusion matrix
- Save report JSON
- Exit code 1 nếu accuracy < threshold (cho CI)

**CLI:**

```bash
python scripts/eval_classifier.py \
  --api-url http://localhost:8002 \
  --test-set tests/fixtures/ticket_samples.csv \
  --min-accuracy 0.80 \
  --output reports/sprint5.json
```

**Acceptance criteria:**

- [ ] Script chạy với mock API (test)
- [ ] Report JSON format đúng
- [ ] CI có thể fail nếu accuracy drop
- [ ] Doc trong `README.md` của script

---

### A5.6 — Workflow: ticket-routing.json

**Mục tiêu:** Auto-route ticket đến technician phù hợp khi mới tạo.

**Logic:**

1. Webhook nhận `ticket-created` event
2. Call AI service `/recommend`
3. Auto-assign top 1 technician
4. Update ticket trong DB (gọi ticket-service `/tickets/{id}/assign`)
5. Notify technician

**Acceptance criteria:**

- [ ] Workflow import OK
- [ ] Manual test: tạo ticket → check assigned
- [ ] Fallback khi AI down: skip auto-assign, để manual
- [ ] Log mỗi step

---

## 4. Models / Prompts

**Prompts hiện tại:**

- `prompts/classify_v1.txt` — Ollama system prompt

**Sprint 5 cần:**

- Thêm `prompts/classify_v2.txt` (sau optimize A5.1)
- Thêm `prompts/extract_entities.txt` (cho knowledge base)

**Model config (`config.py`):**

```python
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")
CACHE_TTL_SEC = int(os.getenv("CACHE_TTL_SEC", "3600"))
```

---

## 5. Testing

**Hiện trạng:** 16 tests trong `test_classify.py`.

**Sprint 5 cần thêm:**

- `test_similar.py` (8 tests) — semantic search
- `test_recommend_v2.py` (10 tests) — v2 algorithm
- `test_eval_script.py` (5 tests) — eval script logic

**Tổng mục tiêu:** 16 → 39 tests.

**Test với Ollama thật:**

- Có thể skip nếu Ollama không available
- Mock Ollama response cho CI

---

## 6. Tích hợp với các bộ phận khác

**Cần từ Backend (B5.1):**

- n8n sẽ gọi `/notify` của notification-service
- Auto-assign cần endpoint `/tickets/{id}/assign` (BE tạo)

**Cần từ Frontend (F5.1):**

- `/admin/metrics` đã có ở Sprint 4
- Hiển thị top_assignees (recommender output) — nếu có

**Phối hợp:**

- Daily standup: thông báo khi workflow n8n ready để test
- Code review chéo: AI workflow logic review bởi Backend

---

## 7. Definition of Done

- [ ] Code merged vào develop
- [ ] All tests pass (`pytest tests/`)
- [ ] Eval script chạy được, accuracy report updated
- [ ] 4 n8n workflows import thành công
- [ ] Document trong `docs/ai-evaluation-sprint5.md`
- [ ] Demo cho team (5 phút)

---

## 8. Tài liệu tham chiếu

- `docs/architecture.md` (section 7.2) — AI classifier design
- `services/ai-service/app/services/ai_classifier.py` — current impl
- `services/ai-service/tests/test_classify.py` — existing tests
- `core/n8n/` — n8n config
- Ollama docs: https://ollama.com
