import { createFileRoute } from "@tanstack/react-router";

// Splat proxy for sstudy.site (Physics Wallah) APIs.
// Examples:
//   /api/public/pw/batches?exam=IIT-JEE&class=11
//   /api/public/pw/tests?batchId=...&testCatId=...
//   /api/public/pw/tests/{id}/questions
//   /api/public/pw/tests/{id}/solutions
//   /api/public/pw/tests/{id}/leaderboard

// ── Rate Limit Store ──────────────────────────────────────────────
// Memory mein store hota hai — worker restart pe reset ho jaata hai
// Per IP: max 120 requests per minute
const rateStore = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS = 120;   // 1 minute mein max kitne requests
const WINDOW_MS   = 60_000; // 1 minute window

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateStore.get(ip);

  if (!entry || now > entry.resetAt) {
    // Naya window shuru
    rateStore.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count++;

  if (entry.count > MAX_REQUESTS) {
    return true; // Limit cross ho gayi
  }

  return false;
}

// Old entries clean karo har 5 minutes mein (memory leak rokne ke liye)
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateStore.entries()) {
    if (now > entry.resetAt) rateStore.delete(ip);
  }
}, 5 * 60_000);
// ─────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/api/public/pw/$")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        // ── Step 1: IP nikalo ──
        const ip =
          request.headers.get("cf-connecting-ip") ??   // Cloudflare real IP
          request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
          "unknown";

        // ── Step 2: Rate limit check ──
        if (isRateLimited(ip)) {
          return new Response(
            JSON.stringify({ error: "Too many requests. Please slow down." }),
            {
              status: 429,
              headers: {
                "content-type": "application/json",
                "retry-after": "60",
              },
            }
          );
        }

        // ── Step 3: Origin check — sirf apni site se requests allow karo ──
        const origin  = request.headers.get("origin")  ?? "";
        const referer = request.headers.get("referer") ?? "";
        const allowedOrigins = [
          "https://adhyayxp.zexofile.workers.dev",
          "https://adhyayxp.pages.dev",
          // Custom domain add karna ho toh yahan daalo:
          // "https://adhyayxp.com",
        ];

        const isAllowed =
          allowedOrigins.some((o) => origin.startsWith(o) || referer.startsWith(o)) ||
          origin === ""   // Server-side render ke liye (SSR)
        ;

        if (!isAllowed) {
          return new Response(
            JSON.stringify({ error: "Forbidden" }),
            { status: 403, headers: { "content-type": "application/json" } }
          );
        }

        // ── Step 4: Proxy to sstudy.site ──
        const splat = String((params as { _splat?: string })._splat ?? "");
        if (!splat) return new Response("Bad path", { status: 400 });

        const search   = new URL(request.url).search;
        const upstream = `https://v1.sstudy.site/api/${splat}${search}`;

        const res = await fetch(upstream, {
          headers: {
            accept: "*/*",
            referer: "https://www.sstudy.site/",
            origin: "https://www.sstudy.site",
            "user-agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
          },
        });

        const body = await res.text();
        return new Response(body, {
          status: res.status,
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "public, max-age=120",
          },
        });
      },
    },
  },
});
