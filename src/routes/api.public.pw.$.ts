import { createFileRoute } from "@tanstack/react-router";

// Splat proxy for sstudy.site (Physics Wallah) APIs.
// Examples:
//   /api/public/pw/batches?exam=IIT-JEE&class=11
//   /api/public/pw/tests?batchId=...&testCatId=...
//   /api/public/pw/tests/{id}/questions
//   /api/public/pw/tests/{id}/solutions
//   /api/public/pw/tests/{id}/leaderboard
export const Route = createFileRoute("/api/public/pw/$")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
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
