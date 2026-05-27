import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/affair/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = String(params.id ?? "").replace(/[^0-9]/g, "");
        if (!id) return new Response("Bad id", { status: 400 });
        const upstream = `https://testegy.com/api/v1/currentAffairs?action=get_single_current_affair_by_id&id=${id}`;
        const res = await fetch(upstream, { headers: { accept: "application/json" } });
        const body = await res.text();
        return new Response(body, {
          status: res.status,
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "public, max-age=600",
          },
        });
      },
    },
  },
});
