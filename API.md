# AdhyayX — APIs Reference

All data fetched by the client goes through **first-party proxy routes**
served by our own TanStack Start server at `https://adhyayx.site/api/public/*`.
This hides upstream origins, lets us cache responses at the edge, and applies
per-IP rate limiting before any external request is made.

## Architecture

```
Browser
   │
   │   fetch("/api/public/<…>")   ← only adhyayx.site URLs in the network tab
   ▼
TanStack Start route handler          (src/routes/api.public.*.ts)
   │
   │   enforceRateLimit()              (src/lib/rate-limit.server.ts)
   │   origin/referer allowlist (PW)
   ▼
Upstream API
   ├─ testegy.com           → current affairs + daily news
   ├─ v1.sstudy.site        → Physics Wallah tests / questions / solutions
   └─ Supabase (REST)       → first-party tests + questions DB
```

Client-side wrappers live next to feature code:

| Domain          | Client helper           | Server proxy                          |
| --------------- | ----------------------- | ------------------------------------- |
| Current affairs | `src/lib/affairsApi.ts` | `src/routes/api.public.affairs.ts`    |
| Affair detail   | `src/lib/affairsApi.ts` | `src/routes/api.public.affair.$id.ts` |
| Daily news      | `src/lib/affairsApi.ts` | `src/routes/api.public.news.ts`       |
| Physics Wallah  | `src/lib/pwApi.ts`      | `src/routes/api.public.pw.$.ts`       |
| Tests DB        | `src/lib/testApi.ts`    | `src/routes/api.public.db.$.ts`       |

## Rate limiting

Implemented in `src/lib/rate-limit.server.ts`. Per-IP token buckets are kept
in module-level `Map`s and pruned opportunistically every 5 minutes (no
`setInterval` — Cloudflare Workers forbid timers at module scope).

| Bucket          | Max / minute | Notes                                      |
| --------------- | ------------ | ------------------------------------------ |
| `pw`            | 600          | Home page fans out 260+ batch calls.       |
| `db`            | 120          | Supabase tests / questions.                |
| `affairs`       | 90           | List pagination + infinite scroll.         |
| `news`          | 90           | Same.                                      |
| `affair-detail` | 120          | Expanded digest reads.                     |

Exceeding a bucket returns:

```json
HTTP 429
Retry-After: 60
{ "error": "Too many requests. Please slow down." }
```

## Endpoints

### `GET /api/public/affairs?page=<n>`

Proxies `testegy.com/api/v1/currentAffairs?action=get_all_current_affairs`.

Response (truncated):

```json
{
  "code": 200,
  "result": {
    "data": {
      "total_count": 1704,
      "data": [
        [4343, "Current Affairs Daily Digest - 30 May 2026",
         "2026-05-30 02:00:35+00", "2026-05-30"],
        ...
      ]
    }
  }
}
```

Each row is `[id, title, createdAt, date]`. Page size = **10** items.
Cache: `public, max-age=300`.

### `GET /api/public/affair/:id`

Single digest. Returns `result.data.content` as a JSON-encoded array of
HTML blocks rendered with sanitized Tailwind selectors on the client.
Cache: `public, max-age=600`.

### `GET /api/public/news?page=<n>`

Proxies `testegy.com/api/v1/currentNews?action=get_all_current_news`.
Row shape: `[id, title, summary, createdAt, image_path]`. Image paths are
relative to `https://testegy.com`; the client converts them to absolute URLs.
Cache: `public, max-age=180`.

### `GET /api/public/pw/<splat>`

Generic splat proxy onto `https://v1.sstudy.site/api/<splat>`. The proxy:

1. Enforces an **origin/referer allowlist** (adhyayx.site domains + lovable
   previews) so the endpoint cannot be hot-linked.
2. Injects the upstream `referer` + `origin` headers Physics Wallah expects.
3. Caches successful responses at `public, max-age=120`.

Used paths (see `src/lib/pwApi.ts`):

| Client call               | Proxied to                                            |
| ------------------------- | ----------------------------------------------------- |
| `batches?exam=…&class=…`  | `…/api/batches?exam=…&class=…`                        |
| `tests?batchId=…&testCatId=…` | `…/api/tests?batchId=…&testCatId=…`               |
| `tests/{id}/questions`    | `…/api/tests/{id}/questions`                          |
| `tests/{id}/solutions`    | `…/api/tests/{id}/solutions`                          |
| `tests/{id}/instructions` | `…/api/tests/{id}/instructions`                       |
| `tests/{id}/leaderboard`  | `…/api/tests/{id}/leaderboard`                        |

### `GET /api/public/db/<table>?<query>`

Whitelisted proxy onto Supabase PostgREST. Only `tests` and `questions`
tables are reachable; everything else returns 403. The Supabase URL and
anon key live exclusively in the server bundle.

Examples used by `src/lib/testApi.ts`:

```
/api/public/db/tests?select=*&status=eq.active&order=stream.asc,created_at.desc
/api/public/db/questions?select=id,question_text,image,options,subject,marks,negative_marks,type,correct&test_id=eq.<uuid>
```

## Client behaviour

* **Infinite scroll.** Daily News + Current Affairs use
  `useInfiniteScroll` (IntersectionObserver) to bump page count when a
  sentinel scrolls into view. No "Load more" buttons.
* **Smart date picker.** Picking a date in Current Affairs calls
  `fetchAffairsForDate()` which estimates the target page from
  `(today - date) / pageSize` and fetches an expanding window around it,
  so jumping to e.g. 2020-04-15 doesn't require loading 170 sequential
  pages.
* **React Query.** All endpoints are wrapped in `useQuery` with stable
  keys; we keep the previous page's data while a new range is in-flight
  via `placeholderData: (prev) => prev`.

## Anti-extraction measures

* `src/lib/devtools-block.ts` is initialised from `__root.tsx` on every
  route. It disables right-click, common DevTools shortcuts, drag-from
  on images, and overlays an "Access Restricted" block when DevTools is
  detected via viewport-size or debugger-timing heuristics. Console
  methods are no-ops in production builds.
* The PW proxy refuses requests whose `origin`/`referer` are not part of
  the AdhyayX origin allowlist.
* Per-IP rate limits make bulk scraping painful.

These measures are deterrents — a determined attacker with full browser
control can always replay HTTP requests. Treat them as friction, not as
security.
