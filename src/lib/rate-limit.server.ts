// Per-IP token-bucket style rate limiter for server routes.
// Cloudflare Workers disallow setInterval in module scope, so we prune
// opportunistically inside each request.

type Entry = { count: number; resetAt: number };

const stores = new Map<string, Map<string, Entry>>();
const lastPruneAt = new Map<string, number>();
const PRUNE_INTERVAL_MS = 5 * 60_000;

function pruneExpired(store: Map<string, Entry>, now: number) {
  for (const [ip, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(ip);
  }
}

export interface RateLimitOpts {
  /** Unique bucket key per route family (e.g. "pw", "affairs", "news"). */
  bucket: string;
  /** Max requests per window. */
  max: number;
  /** Window length in ms. */
  windowMs: number;
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}

export function isRateLimited(request: Request, opts: RateLimitOpts): boolean {
  const ip = getClientIp(request);
  const now = Date.now();

  let store = stores.get(opts.bucket);
  if (!store) {
    store = new Map();
    stores.set(opts.bucket, store);
  }

  const last = lastPruneAt.get(opts.bucket) ?? 0;
  if (now - last > PRUNE_INTERVAL_MS) {
    lastPruneAt.set(opts.bucket, now);
    pruneExpired(store, now);
  }

  const entry = store.get(ip);
  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + opts.windowMs });
    return false;
  }

  entry.count++;
  return entry.count > opts.max;
}

export function rateLimitResponse(): Response {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please slow down." }),
    {
      status: 429,
      headers: {
        "content-type": "application/json",
        "retry-after": "60",
      },
    },
  );
}

/** Convenience: returns a 429 Response if rate-limited, otherwise null. */
export function enforceRateLimit(
  request: Request,
  opts: RateLimitOpts,
): Response | null {
  return isRateLimited(request, opts) ? rateLimitResponse() : null;
}
