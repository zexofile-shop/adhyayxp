import { createFileRoute } from "@tanstack/react-router";

// =====================================================================
// Proxy route — upstream URL ko user se HIDE karta hai.
// Browser mein dikhta hai:  https://adhyayx.site/api/books/dl/<BOOK_ID>
//
// Internally hota kya hai:
//  1. Upstream API call karte hain with redirect:"manual" -> 302 milta hai
//  2. Uss 302 ki Location header me Cloudflare R2 ki presigned URL hoti hai
//  3. Hum khud R2 ko fresh fetch karte hain (clean headers => kabhi block nahi)
//  4. PDF body ko stream karke user ko bhej dete hain
//  5. Content-Disposition HUM control karte hain:
//        ?view=2  -> inline  (browser PDF viewer me khulega)
//        default  -> attachment download as adhyayx-<bookId>.pdf
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

        try {
          // ---- Step 1: upstream se sirf redirect Location nikalo ----
          const upstream = `${UPSTREAM_BASE}/${id}`;
          const head = await fetch(upstream, {
            method: "GET",
            redirect: "manual",
            headers: {
              accept: "*/*",
            },
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
            return streamPdf(head, id, isView);
          }

          // ---- Step 2: presigned R2 URL ko fresh fetch karo ----
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

          // ---- Step 3: stream + apna disposition ----
          return streamPdf(fileRes, id, isView);
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

function streamPdf(res: Response, id: string, isView: boolean) {
  const contentType = res.headers.get("content-type") ?? "application/pdf";
  const contentLength = res.headers.get("content-length");

  const disposition = isView
    ? `inline; filename="adhyayx-${id}.pdf"`
    : `attachment; filename="adhyayx-${id}.pdf"`;

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
