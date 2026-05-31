import { createFileRoute } from "@tanstack/react-router";
import { enforceRateLimit } from "@/lib/rate-limit.server";

// Splat proxy that hides the Supabase REST endpoint + anon key behind
// adhyayx.site. Browser hits /api/public/db/<table>?select=... and we
// forward to the real Supabase project server-side.
const SUPABASE_URL = "https://gaqyuylvawgoxuaevhsi.supabase.co/rest/v1";
const SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhcXl1eWx2YXdnb3h1YWV2aHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MDExNTQsImV4cCI6MjA2Nzk3NzE1NH0.tRJXi5vTSopCza_61sYu2ccOrk8LR7UvJ07JPP07OEI";

export const Route = createFileRoute("/api/public/db/$")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const limited = enforceRateLimit(request, {
          bucket: "db",
          max: 120,
          windowMs: 60_000,
        });
        if (limited) return limited;

        const splat = String((params as { _splat?: string })._splat ?? "");
        if (!splat) return new Response("Bad path", { status: 400 });

        // Only allow read-only listings of whitelisted tables.
        const table = splat.split("/")[0]?.split("?")[0] ?? "";
        const allowedTables = new Set(["tests", "questions"]);
        if (!allowedTables.has(table)) {
          return new Response(JSON.stringify({ error: "Forbidden table" }), {
            status: 403,
            headers: { "content-type": "application/json" },
          });
        }

        const search = new URL(request.url).search;
        const upstream = `${SUPABASE_URL}/${splat}${search}`;
        const res = await fetch(upstream, {
          headers: {
            apikey: SUPABASE_ANON,
            Authorization: `Bearer ${SUPABASE_ANON}`,
            "accept-profile": "public",
            accept: "*/*",
          },
        });

        const body = await res.text();
        return new Response(body, {
          status: res.status,
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "public, max-age=60",
          },
        });
      },
    },
  },
});
