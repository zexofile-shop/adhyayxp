import { createFileRoute } from "@tanstack/react-router";

// =====================================================================
// Proxy route — upstream URL ko user se HIDE karta hai.
// Browser mein dikhta hai:  https://adhyayx.site/api/books/dl/<BOOK_ID>
// Server silently fetch karta hai:
//   https://api.allcompetitionclasses.co.in/api/v1/books/dl/<BOOK_ID>
//
// Query params:
//   ?view=1  -> inline (browser PDF viewer mein khole, download nahi)
//   (default) -> attachment download as adhyayx-<bookId>.pdf
// =====================================================================

const UPSTREAM_BASE = "https://api.allcompetitionclasses.co.in/api/v1/books/dl";

export const Route = createFileRoute("/api/books/dl/$bookId")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const id = (params as { bookId: string }).bookId;
        const url = new URL(request.url);
        const isView = url.searchParams.get("view") === "1";

        try {
          const upstream = `${UPSTREAM_BASE}/${id}`;
          const res = await fetch(upstream, {
            headers: {
              "user-agent": "Mozilla/5.0 (compatible; AdhyayX/1.0)",
            },
          });

          if (!res.ok) {
            return new Response(
              JSON.stringify({ error: "File not found" }),
              {
                status: 404,
                headers: { "content-type": "application/json" },
              }
            );
          }

          const contentType =
            res.headers.get("content-type") ?? "application/pdf";
          const disposition = isView
            ? `inline; filename="adhyayx-${id}.pdf"`
            : `attachment; filename="adhyayx-${id}.pdf"`;

          return new Response(res.body, {
            status: 200,
            headers: {
              "content-type": contentType,
              "content-disposition": disposition,
              "cache-control": "public, max-age=3600",
              "x-robots-tag": "noindex",
            },
          });
        } catch (err) {
          console.error("Books proxy error:", err);
          return new Response("Server error", { status: 500 });
        }
      },
    },
  },
});
