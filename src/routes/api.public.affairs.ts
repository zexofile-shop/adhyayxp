import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/affairs")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const page = url.searchParams.get("page") ?? "1";
        const upstream = `https://testegy.com/api/v1/currentAffairs?action=get_all_current_affairs&page=${encodeURIComponent(page)}`;
        const res = await fetch(upstream, { headers: { accept: "application/json" } });
        const body = await res.text();
        return new Response(body, {
          status: res.status,
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "public, max-age=300",
          },
        });
      },
    },
  },
});
