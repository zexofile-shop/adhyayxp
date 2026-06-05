# Implementation Plan

## 1. Firebase Realtime Database integration (no auth)

- Add `firebase` package via `bun add firebase`.
- Create `src/lib/firebase.ts` that reads config from `import.meta.env.VITE_FIREBASE_*` and initializes the app + RTDB (skip Analytics — it's browser-only and not needed).
- Create `.env` (gitignored) with your config, and a committed `.env.example` template so other devs know the shape.
- Update `.gitignore` to include `.env`, `.env.local`, `.env.*.local` (keep `.env.example` tracked).

### Where Firebase will be used (realtime)
- `src/components/site/AffairsNewsPreview.tsx` / home counters → live `activeTestsCount`, `pwBatchesCount`, `pwTestsCount`, `booksCount` from RTDB paths like `/stats/*`. The numbers update without refresh via `onValue`.
- A tiny `src/lib/stats.ts` helper exposes `useLiveStat(path, fallback)` hook.
- Background refresh: when `fetchPwTotalTests()` / `fetchPwTotalBatches()` resolve client-side, write the result to `/stats/pwTests` and `/stats/pwBatches` so the next visitor sees it instantly.

### Securing your Firebase DB (so no other dev can wipe it)
Your config (`apiKey`, `databaseURL`, etc.) is **public by design** — it identifies the project, it does not grant access. Security comes from **Realtime Database Rules**. In Firebase Console → Realtime Database → Rules, paste:

```json
{
  "rules": {
    ".read": true,
    ".write": false,
    "stats": {
      ".read": true,
      ".write": false
    }
  }
}
```

This makes the DB **public read-only**. No one (including a stolen key) can write or delete. You will write/update values yourself from the Firebase Console, or temporarily flip `.write` to a server-side admin SDK route guarded by a secret (we are NOT doing that now per your request — no login, no server admin).

Optional hardening:
- In Console → Project Settings → App Check, enable App Check with reCAPTCHA v3 and enforce it on Realtime Database. This blocks scripts running outside your domain.
- In Console → Authentication → Settings → Authorized Domains, keep only `adhyayxp.lovable.app`, `id-preview--*.lovable.app`, `localhost`.
- API key restrictions in Google Cloud Console → Credentials → restrict the browser key to your domains (HTTP referrers).

Result: even with the full config leaked, an attacker cannot delete or overwrite anything. You stay the only writer via the Firebase Console UI.

## 2. Remove VidyaX, keep exactly 770 books
- `src/lib/booksApi.ts`: drop the merge with `vx-books.json`, return only `books.json`.
- Delete `public/data/vx-books.json`, `src/data/vxBookUrlMap.ts`, `src/routes/api.public.vx.$.ts`.
- Strip `vx-` handling from `src/routes/api.books.dl.$bookId.ts`.

## 3. Remove "Featured" title everywhere on book cards (verify both list & detail).

## 4. PW class filter — real data from API
- Replace the hardcoded `PW_CLASSES` constant with the actual list returned by the PW filter endpoint already wired into `fetchPwFilters()`. Use the live response in `src/routes/pw.tsx` and in `fetchPwTotalBatches/Tests`.

## 5. Real-time counters on home & categories
- Home "Active tests" badge and Categories "Total batches" badge now subscribe to `/stats/pwTests` and `/stats/pwBatches` via `onValue` → instant render, no refresh delay.
- First visit triggers a background `fetchPwTotal*` to seed/update the value in RTDB.

## 6. Faster book reader + preview (instant load regardless of size)
- Switch `src/routes/api.books.dl.$bookId.ts` to always pass through HTTP Range requests with `Accept-Ranges: bytes` and stream — already partially there, will tighten headers (`Cache-Control: public, max-age=31536000, immutable`, `Content-Type: application/pdf`).
- In `BookPDFPreview` and `books_.read.$bookId.tsx`:
  - Set `react-pdf` options: `disableStream: false`, `disableAutoFetch: true` (key change — only fetches the visible page's byte range, not the whole file).
  - Lower `rangeChunkSize` to `32768` for snappier first paint.
  - Pre-warm the worker once at app root.
- Result: first page renders as soon as the PDF's cross-reference table downloads (~tens of KB) regardless of total file size.

## 7. Reader UI/UX polish
- Add: zoom +/-, fit-width toggle, jump-to-page (already there), dark/sepia/light theme toggle, fullscreen, keyboard shortcut hints, thumbnail strip toggle, progress %.
- Smooth page transitions, sticky compact toolbar, mobile-optimized bottom bar.

## 8. Real page count under book title
- The JSON's `totalPages` is unreliable. Add a tiny `getPdfPageCount(url)` util using `pdfjs.getDocument().promise → numPages`, cache result in `localStorage` keyed by book id, and also persist to RTDB `/bookPages/{id}` so all visitors get the cached real count instantly.
- `BookCard` and detail page read from this cache first, fall back to `totalPages`, and silently refresh in the background.

## 9. Cloud hosting secrets (Cloudflare Workers via `wrangler`)

Add these as **Worker secrets** in Cloudflare Dashboard → Workers & Pages → `adhyayxp` → Settings → Variables and Secrets → "Add variable" (encrypt = Secret for the first 6, Plain text for the public ones):

| Name | Type | Value |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Plain (build-time) | `AIzaSyAjycQTRLL8Pz6RKY36dZ-r6XXfi8pdEm0` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Plain | `niteshh-pvt.firebaseapp.com` |
| `VITE_FIREBASE_DATABASE_URL` | Plain | `https://niteshh-pvt-default-rtdb.firebaseio.com` |
| `VITE_FIREBASE_PROJECT_ID` | Plain | `niteshh-pvt` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Plain | `niteshh-pvt.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Plain | `723170054401` |
| `VITE_FIREBASE_APP_ID` | Plain | `1:723170054401:web:04bd538bac268969c88b00` |
| `VITE_FIREBASE_MEASUREMENT_ID` | Plain | `G-2L8RZ97WW4` |

Note: `VITE_*` vars are **build-time** — they get inlined into the JS bundle. For Cloudflare, add them as **GitHub Actions secrets** (Repo → Settings → Secrets and variables → Actions) under the **same names** so `bun run build` in `.github/workflows/deploy.yml` picks them up. I'll also patch the workflow to forward these to the build step.

No runtime-only secrets are needed for Firebase since the client SDK uses the public config + DB rules for security.

---

## Files to be created / edited
- create: `src/lib/firebase.ts`, `src/lib/stats.ts`, `src/lib/pdfPages.ts`, `.env`, `.env.example`
- edit: `.gitignore`, `.github/workflows/deploy.yml`, `src/lib/booksApi.ts`, `src/lib/pwApi.ts`, `src/routes/pw.tsx`, `src/routes/api.books.dl.$bookId.ts`, `src/routes/books.tsx`, `src/routes/books_.$bookId.tsx`, `src/routes/books_.read.$bookId.tsx`, `src/components/site/BookPDFPreview.tsx`, `src/components/site/AffairsNewsPreview.tsx`, `src/routes/categories.tsx`, `src/routes/index.tsx`
- delete: `public/data/vx-books.json`, `src/data/vxBookUrlMap.ts`, `src/routes/api.public.vx.$.ts`

Shall I proceed?
