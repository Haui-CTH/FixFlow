# Frontend Sprint 5 — Kế hoạch chi tiết

> **Owner:** Frontend Dev
> **Phạm vi sở hữu:** `app/src/**`, `app/package.json`, `app/vite.config.ts`, `app/nginx.conf`
> **Trạng thái tham chiếu:** sau Sprint 4, develop HEAD `f2a911b`

---

## 0. Quy tắc cá nhân

- Mỗi component có test (Vitest + React Testing Library).
- API call mới/đổi → cập nhật `src/lib/api.ts` typed wrapper.
- KHÔNG hardcode URL backend, dùng `import.meta.env.VITE_API_URL`.
- Push qua `./scripts/git-sync.sh push`.
- Cuối ngày có 1 commit `chore(frontend): daily-log ngày N`.

---

## 1. Tổng quan Sprint 5

| Mục tiêu | Loại | Effort |
|---|---|---|
| F5.1 Wire Dashboard vào `/admin/metrics` | Feature | 4h |
| F5.2 Trang Notifications center | Feature | 3h |
| F5.3 Notes viewer (staff) + composer | Feature | 2h |
| F5.4 History timeline component | Feature | 2h |
| F5.5 Responsive mobile breakpoints | Polish | 2h |
| F5.6 Error boundary + toast notification | Polish | 1h |

Tổng: ~14h (≈ 2 ngày)

---

## 2. Backlog chi tiết

### F5.1 — Wire Dashboard vào `/admin/metrics`

**Hiện trạng:** `src/pages/Dashboard.tsx` đang hiển thị data tĩnh hoặc mock.

**Mục tiêu:** Connect vào endpoint `GET /admin/metrics` backend mới.

**API contract (Sprint 4):**

```ts
interface MetricsResponse {
  generated_at: string
  window_days: number
  total_tickets: number
  by_status: Array<{ status: string; count: number }>
  by_priority: Array<{ priority: string; count: number }>
  by_category: Array<{ category: string; count: number }>
  sla: {
    total_active: number
    on_time: number
    breached: number
    met: number
    not_met: number
    breach_rate: number
  }
  activity: {
    last_24h_created: number
    last_24h_resolved: number
    last_24h_breached: number
  }
  outbox: {
    pending: number
    sending: number
    sent: number
    failed: number
    oldest_pending_age_sec: number | null
  }
  top_assignees: Array<{
    user_id: string
    username: string | null
    full_name: string | null
    active_tickets: number
    resolved_tickets: number
  }>
}
```

**File thay đổi:**

- `src/pages/Dashboard.tsx` — dùng `useQuery` fetch `/admin/metrics`
- `src/components/DashboardKPICard.tsx` (new) — card với icon + number + delta
- `src/components/BreachRateGauge.tsx` (new) — circular gauge cho SLA breach rate
- `src/components/OutboxHealthBadge.tsx` (new) — status badge cho outbox
- `src/components/TopAssigneesTable.tsx` (new) — top 5 technicians

**Layout mong muốn:**

```
┌────────────────────────────────────────────────────┐
│ [Total: 27] [Active: 23] [SLA: 13%] [Outbox: ⚠ 1] │  ← 4 KPI cards
├──────────────────────┬─────────────────────────────┤
│ By Status (pie)      │ By Priority (bar)           │
├──────────────────────┴─────────────────────────────┤
│ SLA Stats (gauge)        │ Activity 24h (sparkline)│
├──────────────────────────┴──────────────────────────┤
│ Top 5 Assignees (table)                            │
└────────────────────────────────────────────────────┘
```

**Acceptance criteria:**

- [ ] Dashboard refresh mỗi 30s (TanStack Query `refetchInterval`)
- [ ] Loading state (skeleton)
- [ ] Error state (retry button + toast)
- [ ] Permission guard: customer/technician → redirect `/tickets`
- [ ] Test Dashboard component với mocked API

**Libs cần thêm (nếu chưa có):**

```json
"recharts": "^2.12.0",
"react-circular-progressbar": "^2.1.0"
```

---

### F5.2 — Trang Notifications center

**Hiện trạng:** Chưa có trang. Notification-service mới có ở Sprint 5 (BE).

**Mục tiêu:** User xem được các notifications của mình, mark as read.

**Route mới:** `/notifications` (protected)

**API endpoints cần (BE sẽ tạo):**

| Method | Path | Mô tả |
|---|---|---|
| GET | `/notifications?unread_only=true` | List notifications |
| PATCH | `/notifications/{id}/read` | Mark as read |
| POST | `/notifications/mark-all-read` | Bulk mark |

**File mới:**

- `src/pages/Notifications.tsx` — list view
- `src/components/NotificationItem.tsx` — single row
- `src/hooks/useNotifications.ts` — TanStack Query wrapper
- `src/components/NotificationBell.tsx` — header bell với unread count

**Acceptance criteria:**

- [ ] List hiển thị: title, message, timestamp, read/unread badge
- [ ] Click notification → mark as read + (optional) navigate
- [ ] Bell icon ở header với badge count
- [ ] Polling mỗi 60s cho bell count
- [ ] Empty state khi không có notification
- [ ] Test với mocked API

---

### F5.3 — Notes viewer (staff) + composer

**API đã có (Sprint 4):** `GET/POST /tickets/{id}/notes`

**Hiện trạng:** TicketDetail.tsx chưa có tab Notes.

**Mục tiêu:** Tab "Internal Notes" trong TicketDetail (staff only).

**File thay đổi:**

- `src/pages/TicketDetail.tsx` — thêm tabs
- `src/components/NotesList.tsx` (new) — list notes với author + timestamp
- `src/components/NoteComposer.tsx` (new) — textarea + submit

**UI:**

```
┌─ Ticket Detail ─────────────────────────────────────┐
│ [Overview] [Comments] [Notes (3)] [History] [Attach] │  ← tabs
├──────────────────────────────────────────────────────┤
│ ┌─ New Note ─────────────────────────────────────┐   │
│ │ [textarea, 5000 chars max]                     │   │
│ │ [Add Note]                                     │   │
│ └────────────────────────────────────────────────┘   │
│ ┌─ Trần Văn Kỹ Thuật · 2h ago ─────────────────┐   │
│ │ Đã liên hệ vendor, ETA 24h                    │   │
│ └────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

**Acceptance criteria:**

- [ ] Customer role: ẩn tab Notes hoàn toàn
- [ ] Staff: thấy notes + composer
- [ ] Validation: 5000 chars, không empty/whitespace
- [ ] Loading state khi submit
- [ ] Toast success/error
- [ ] Test permission guard

---

### F5.4 — History timeline component

**API đã có (Sprint 4):** `GET /tickets/{id}/history`

**Mục tiêu:** Visual timeline của audit log.

**File mới:**

- `src/components/HistoryTimeline.tsx` — vertical timeline với icons
- `src/hooks/useTicketHistory.ts` — TanStack Query

**Action → Icon mapping:**

| Action | Icon | Color |
|---|---|---|
| `status_changed` | arrow-right | blue |
| `comment_added` | chat | gray |
| `note_added` | sticky-note | yellow |
| `attachment_added` | paperclip | green |
| `assigned` | user-plus | purple |

**Acceptance criteria:**

- [ ] Reverse chronological order (newest first)
- [ ] Actor name hiển thị (từ `actor.full_name`)
- [ ] Pagination (load more)
- [ ] Relative time ("2h ago")
- [ ] Test với mocked data

---

### F5.5 — Responsive mobile breakpoints

**Hiện trạng:** Một số component chưa responsive (check Layout.tsx).

**Mục tiêu:** Tối ưu mobile (375px), tablet (768px).

**Components cần kiểm tra:**

- `Layout.tsx` — sidebar collapse trên mobile
- `Tickets.tsx` — table → card view
- `TicketDetail.tsx` — tabs scrollable
- `Dashboard.tsx` — KPI cards stack 1-column
- `Login.tsx` — form full-width

**Acceptance criteria:**

- [ ] Test với Chrome DevTools mobile mode
- [ ] No horizontal scroll trên 375px width
- [ ] Touch targets ≥ 44px
- [ ] Sidebar có hamburger menu

---

### F5.6 — Error boundary + toast notification

**Hiện trạng:** Có thể có lỗi unhandled làm crash app.

**Mục tiêu:** Graceful error handling + user feedback.

**File mới:**

- `src/components/ErrorBoundary.tsx`
- `src/components/ToastProvider.tsx` + `useToast()` hook
- `src/lib/api.ts` — interceptor handle 401/403/500

**Acceptance criteria:**

- [ ] Error boundary ở root catch mọi unhandled error
- [ ] Toast cho success/error actions (create, update, delete)
- [ ] 401 response → redirect `/login`
- [ ] 403 response → toast "Permission denied"
- [ ] Network error → toast "Connection lost, retry?"

---

## 3. Pages hiện có (reference)

| File | Trạng thái | Sprint 5 cần làm |
|---|---|---|
| `Login.tsx` | Có | F5.5 responsive |
| `Dashboard.tsx` | Stub | F5.1 wire API |
| `Tickets.tsx` | List | F5.5 responsive |
| `TicketDetail.tsx` | Detail | F5.3, F5.4 tabs |
| `Notifications.tsx` | Chưa có | F5.2 mới |

---

## 4. API endpoints đã có (BE Sprint 4)

```
GET    /admin/metrics            ← F5.1
GET    /tickets/{id}/notes       ← F5.3
POST   /tickets/{id}/notes       ← F5.3
GET    /tickets/{id}/history     ← F5.4
POST   /tickets/{id}/comments    ← existing
GET    /tickets/{id}/attachments ← existing
GET    /tickets                  ← existing (list)
POST   /tickets                  ← existing
PATCH  /tickets/{id}             ← existing
```

**Sprint 5 cần thêm (BE đồng thời):**

```
GET    /notifications?unread_only= ← F5.2
PATCH  /notifications/{id}/read    ← F5.2
POST   /notifications/mark-all-read ← F5.2
```

---

## 5. Tech stack hiện tại

```json
{
  "react": "^18.x",
  "@tanstack/react-query": "^5.56.2",
  "axios": "^1.7.7",
  "typescript": "^5.x",
  "vite": "^5.x"
}
```

**Có thể cần thêm (Sprint 5):**

- `recharts` — Dashboard charts
- `react-circular-progressbar` — SLA gauge
- `date-fns` — relative time
- `sonner` hoặc `react-hot-toast` — toast
- `react-error-boundary` — Error boundary

---

## 6. Test setup

**Hiện trạng:** Vitest có nhưng test coverage mỏng.

**Mục tiêu tối thiểu Sprint 5:**

- [ ] Dashboard.test.tsx — mock API, render check
- [ ] TicketDetail.test.tsx — tabs switch, permission guard
- [ ] Notifications.test.tsx — list, mark as read
- [ ] ErrorBoundary.test.tsx — error catch + fallback UI

**Pattern:**

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
})

it('renders dashboard with metrics', async () => {
  render(<QueryClientProvider client={queryClient}><Dashboard /></QueryClientProvider>)
  await waitFor(() => expect(screen.getByText('27')).toBeInTheDocument())
})
```

---

## 7. Definition of Done

- [ ] Code merged vào develop
- [ ] CI frontend job pass
- [ ] Tested trên Chrome + Firefox
- [ ] Mobile breakpoint OK (DevTools)
- [ ] Có test component
- [ ] Update `docs/api-specification.md` nếu cần

---

## 8. Tài liệu tham chiếu

- `docs/api-specification.md` — REST contracts
- `app/src/lib/api.ts` — API client wrapper
- `app/src/components/Layout.tsx` — base layout
- Sprint 4 demo (sau khi có)
