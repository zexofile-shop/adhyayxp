import { createFileRoute } from "@tanstack/react-router";
import { PDFDocument } from "pdf-lib";

// =====================================================================
// Proxy route — actual upstream URL ko user se HIDE karta hai.
// User ko browser mein dikhta hai:
//   https://adhyayx.site/api/books/dl/<BOOK_ID>
// Backend silently fetch karta hai:
//   https://api.allcompetitionclasses.co.in/api/v1/books/dl/<BOOK_ID>
//
// Query params:
//   ?view=1      -> inline (browser PDF viewer mein kholo, download nahi)
//   ?preview=1   -> sirf pehle 10 pages ka sliced PDF return karo (inline)
//   (default)    -> attachment download as adhyayx-<bookId>.pdf
// =====================================================================

const UPSTREAM_BASE = "https://api.allcompetitionclasses.co.in/api/v1/books/dl";
const PREVIEW_PAGES = 10;

export const Route = createFileRoute("/api/books/dl/$bookId")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const { bookId } = params as { bookId: string };
        const url = new URL(request.url);
        const isView = url.searchParams.get("view") === "1";
        const isPreview = url.searchParams.get("preview") === "1";

        try {
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

          // ---------- PREVIEW MODE: pehle 10 pages slice karke do ----------
          if (isPreview) {
            const buf = await res.arrayBuffer();
            try {
              const srcPdf = await PDFDocument.load(buf, { ignoreEncryption: true });
              const totalPages = srcPdf.getPageCount();
              const take = Math.min(PREVIEW_PAGES, totalPages);

              const previewPdf = await PDFDocument.create();
              const copied = await previewPdf.copyPages(
                srcPdf,
                Array.from({ length: take }, (_, i) => i)
              );
              copied.forEach((p) => previewPdf.addPage(p));

              previewPdf.setTitle(`AdhyayX Preview — ${bookId}`);
              previewPdf.setProducer("AdhyayX");
              previewPdf.setCreator("AdhyayX");

              const out = await previewPdf.save();
              return new Response(out, {
                status: 200,
                headers: {
                  "content-type": "application/pdf",
                  "content-disposition": `inline; filename="adhyayx-preview-${bookId}.pdf"`,
                  "cache-control": "public, max-age=3600",
                  "x-robots-tag": "noindex",
                },
              });
            } catch (e) {
              console.error("preview slice failed, falling back to full inline:", e);
              return new Response(buf, {
                status: 200,
                headers: {
                  "content-type": "application/pdf",
                  "content-disposition": "inline",
                  "cache-control": "public, max-age=3600",
                  "x-robots-tag": "noindex",
                },
              });
            }
          }

          // ---------- VIEW / DOWNLOAD MODE ----------
          const contentType = res.headers.get("content-type") ?? "application/pdf";
          const disposition = isView
            ? `inline; filename="adhyayx-${bookId}.pdf"`
            : `attachment; filename="adhyayx-${bookId}.pdf"`;

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
