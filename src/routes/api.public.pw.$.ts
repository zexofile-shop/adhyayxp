import { createFileRoute } from "@tanstack/react-router";
import { enforceRateLimit } from "@/lib/rate-limit.server";

// Splat proxy for sstudy.site (Physics Wallah) APIs, surfaced under
// our own /api/public/pw/* namespace so the upstream origin never reaches
// the browser. Heavy rate-limiting + origin allowlist guard the proxy.
export const Route = createFileRoute("/api/public/pw/$")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const limited = enforceRateLimit(request, {
          bucket: "pw",
          max: 120,
          windowMs: 60_000,
        });
        if (limited) return limited;

        const origin = request.headers.get("origin") ?? "";
        const referer = request.headers.get("referer") ?? "";

        const allowedOrigins = [
          "https://adhyayxp.zexofile.workers.dev",
          "https://adhyayxp.pages.dev",
          "https://adhyayx.site",
          "https://www.adhyayx.site",
          "https://adhyayxp.lovable.app",
        ];

        const isAllowed =
          allowedOrigins.some(
            (o) => origin.startsWith(o) || referer.startsWith(o),
          ) ||
          origin === "" ||
          origin.endsWith(".lovable.app");

        if (!isAllowed) {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
            headers: { "content-type": "application/json" },
          });
        }

        const splat = String((params as { _splat?: string })._splat ?? "");
        if (!splat) return new Response("Bad path", { status: 400 });

        const search = new URL(request.url).search;
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
