import { createFileRoute } from "@tanstack/react-router";

// =====================================================================
// PDF Proxy Route
//
// User URL:  /api/books/dl/<UPSTREAM_HEX_ID>
//
// Flow:
//   1. Call upstream with redirect:"manual" → get 302 + R2 presigned URL
//   2a. DOWNLOAD (!isView): return 302 redirect directly to R2 → instant CDN download
//   2b. VIEW   (isView):    proxy through server with Range pass-through (react-pdf
//       needs same-origin; R2 supports 206 partial content for fast page loading)
//
// Query params:
//   ?view=2   → inline  (react-pdf preview / Read Online)
//   ?fn=...   → filename hint for Content-Disposition (URL-encoded)
//   default   → attachment download → 302 to R2
// =====================================================================

const UPSTREAM_BASE =
  "https://api.allcompetitionclasses.co.in/api/v1/books/dl";

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
          // Step 1: get the R2 presigned URL from upstream redirect
          const upstreamUrl = `${UPSTREAM_BASE}/${id}`;
          const headRes = await fetch(upstreamUrl, {
            method: "GET",
            redirect: "manual",
            headers: { accept: "*/*" },
          });

          let r2Url: string | null = null;
          if (headRes.status >= 300 && headRes.status < 400) {
            r2Url = headRes.headers.get("location");
          }

          if (!r2Url) {
            if (headRes.ok) {
              return proxyPdf(headRes, id, isView, fnParam, null);
            }
            return notFound();
          }

          // Step 2a — DOWNLOAD: redirect browser directly to R2 (instant CDN!)
          if (!isView) {
            return new Response(null, {
              status: 302,
              headers: {
                location: r2Url,
                "cache-control": "no-store",
              },
            });
          }

          // Step 2b — VIEW: proxy with Range header pass-through
          // react-pdf (pdf.js) sends Range requests; R2 returns 206 Partial Content.
          // This lets pdf.js load only the pages it needs, not the whole file.
          const rangeHeader = request.headers.get("range");
          const r2Res = await fetch(r2Url, {
            method: "GET",
            redirect: "follow",
            headers: rangeHeader ? { range: rangeHeader } : {},
          });

          if (!r2Res.ok && r2Res.status !== 206) {
            return notFound();
          }

          return proxyPdf(r2Res, id, true, fnParam, rangeHeader);
        } catch (err) {
          console.error("Books proxy error:", err);
          return new Response(JSON.stringify({ error: "Server error" }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});

function notFound() {
  return new Response(JSON.stringify({ error: "File not found" }), {
    status: 404,
    headers: { "content-type": "application/json" },
  });
}

function proxyPdf(
  res: Response,
  id: string,
  isView: boolean,
  fnParam: string | null,
  rangeHeader: string | null
) {
  const contentType = res.headers.get("content-type") ?? "application/pdf";
  const contentLength = res.headers.get("content-length");
  const contentRange = res.headers.get("content-range");
  const acceptRanges = res.headers.get("accept-ranges");

  const safeFilename = fnParam
    ? fnParam.replace(/[^a-zA-Z0-9.\-_]/g, "-").slice(0, 120)
    : `adhyayx-${id}.pdf`;

  const disposition = isView
    ? `inline; filename="${safeFilename}"`
    : `attachment; filename="${safeFilename}"`;

  const headers: Record<string, string> = {
    "content-type": contentType.includes("pdf")
      ? contentType
      : "application/pdf",
    "content-disposition": disposition,
    // Aggressive cache — book PDFs are immutable. Lets browser & CF cache the
    // first byte range so subsequent page jumps are instant.
    "cache-control": "public, max-age=31536000, immutable",
    "x-robots-tag": "noindex",
    "x-content-type-options": "nosniff",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "Range",
    "access-control-expose-headers":
      "Content-Range, Accept-Ranges, Content-Length",
    "accept-ranges": acceptRanges ?? "bytes",
  };

  if (contentLength) headers["content-length"] = contentLength;
  if (contentRange) headers["content-range"] = contentRange;

  // Forward 206 Partial Content status for range requests
  const status = res.status === 206 ? 206 : 200;
  return new Response(res.body, { status, headers });
}
