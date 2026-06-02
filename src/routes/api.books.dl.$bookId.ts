import { createFileRoute } from "@tanstack/react-router";

// =====================================================================
// Proxy route — hides upstream URL from the browser.
// User-visible URL:  https://adhyayx.site/api/books/dl/<BOOK_ID>
//
// Flow:
//  1. Call upstream API with redirect:"manual" → get 302 + Location
//  2. Fetch the presigned R2 URL directly (clean headers, never blocked)
//  3. Stream PDF to user with our own Content-Disposition
//
// Query params:
//   ?view=2   → inline (opens in browser PDF viewer)
//   ?fn=...   → filename to use in Content-Disposition (URL-encoded)
//   default   → attachment download
// =====================================================================

const UPSTREAM_BASE = "https://api.allcompetitionclasses.co.in/api/v1/books/dl";

export const Route = createFileRoute("/api/books/dl/$bookId")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const id = (params as { bookId: string }).bookId;
        const url = new URL(request.url);
        const viewParam = url.searchParams.get("view");
        const isView = viewParam !== null && viewParam !== "0";
        const fnParam = url.searchParams.get("fn");

        try {
          const upstream = `${UPSTREAM_BASE}/${id}`;
          const head = await fetch(upstream, {
            method: "GET",
            redirect: "manual",
            headers: { accept: "*/*" },
          });

          let finalUrl: string | null = null;
          if (head.status >= 300 && head.status < 400) {
            finalUrl = head.headers.get("location");
          }

          if (!finalUrl) {
            if (!head.ok) {
              return new Response(
                JSON.stringify({ error: "File not found" }),
                { status: 404, headers: { "content-type": "application/json" } }
              );
            }
            return streamPdf(head, id, isView, fnParam);
          }

          const fileRes = await fetch(finalUrl, {
            method: "GET",
            redirect: "follow",
          });

          if (!fileRes.ok || !fileRes.body) {
            return new Response(
              JSON.stringify({ error: "File not found" }),
              { status: 404, headers: { "content-type": "application/json" } }
            );
          }

          return streamPdf(fileRes, id, isView, fnParam);
        } catch (err) {
          console.error("Books proxy error:", err);
          return new Response(
            JSON.stringify({ error: "Server error" }),
            { status: 500, headers: { "content-type": "application/json" } }
          );
        }
      },
    },
  },
});

function streamPdf(
  res: Response,
  id: string,
  isView: boolean,
  fnParam: string | null
) {
  const contentType = res.headers.get("content-type") ?? "application/pdf";
  const contentLength = res.headers.get("content-length");

  const safeFilename = fnParam
    ? fnParam.replace(/[^a-zA-Z0-9.\-_]/g, "-").slice(0, 120)
    : `adhyayx-${id}.pdf`;

  const disposition = isView
    ? `inline; filename="${safeFilename}"`
    : `attachment; filename="${safeFilename}"`;

  const headers: Record<string, string> = {
    "content-type": contentType.includes("pdf") ? contentType : "application/pdf",
    "content-disposition": disposition,
    "cache-control": "public, max-age=3600",
    "x-robots-tag": "noindex",
    "x-content-type-options": "nosniff",
  };
  if (contentLength) headers["content-length"] = contentLength;

  return new Response(res.body, { status: 200, headers });
}
