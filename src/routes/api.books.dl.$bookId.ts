import { createFileRoute } from "@tanstack/react-router";

// Proxy route — actual URL hide karta hai
// User ko dikhta hai: adhyayx.site/api/books/dl/BOOK_ID
// Actually jaata hai: api.allcompetitionclasses.co.in/...

const UPSTREAM_BASE = "https://api.allcompetitionclasses.co.in/api/v1/books/dl";

export const Route = createFileRoute("/api/books/dl/$bookId")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const { bookId } = params as { bookId: string };
        const url = new URL(request.url);
        const isView = url.searchParams.get("view") === "1";

        try {
          // Actual URL se file fetch karo — user ko nahi dikhti
          const upstream = `${UPSTREAM_BASE}/${bookId}`;
          const res = await fetch(upstream, {
            headers: {
              "user-agent": "Mozilla/5.0 (compatible; AdhyayX/1.0)",
            },
          });

          if (!res.ok) {
            return new Response(
              JSON.stringify({ error: "File not found" }),
              { status: 404, headers: { "content-type": "application/json" } }
            );
          }

          const contentType =
            res.headers.get("content-type") ?? "application/pdf";

          // View mode: inline (browser mein khulega)
          // Download mode: attachment (download hoga)
          const disposition = isView
            ? "inline"
            : `attachment; filename="${bookId}.pdf"`;

          return new Response(res.body, {
            status: 200,
            headers: {
              "content-type": contentType,
              "content-disposition": disposition,
              "cache-control": "public, max-age=3600",
              // Security: actual upstream URL kisi ko nahi batao
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
