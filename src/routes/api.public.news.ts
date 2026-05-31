import { createFileRoute } from "@tanstack/react-router";
import { enforceRateLimit } from "@/lib/rate-limit.server";

export const Route = createFileRoute("/api/public/news")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const limited = enforceRateLimit(request, {
          bucket: "news",
          max: 90,
          windowMs: 60_000,
        });
        if (limited) return limited;

        const url = new URL(request.url);
        const page = url.searchParams.get("page") ?? "1";
        const upstream = `https://testegy.com/api/v1/currentNews?action=get_all_current_news&page=${encodeURIComponent(page)}`;
        const res = await fetch(upstream, {
          headers: { accept: "application/json" },
        });
        const body = await res.text();
        return new Response(body, {
          status: res.status,
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "public, max-age=180",
          },
        });
      },
    },
  },
});
