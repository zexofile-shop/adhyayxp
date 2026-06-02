import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { BookOpen } from "lucide-react";

const PREVIEW_PAGES = 15;

export function BookPDFPreview({ url }: { url: string }) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pageWidth, setPageWidth] = useState(640);

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    const updateWidth = () => {
      const container = document.getElementById("pdf-preview-container");
      setPageWidth(container ? container.clientWidth - 24 : Math.min(window.innerWidth - 64, 720));
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  if (error) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-ink/15 text-sm text-muted-foreground">
        <BookOpen className="h-8 w-8 opacity-30" />
        <p>Preview load nahi ho saka. Download karke dekho.</p>
      </div>
    );
  }

  const pagesToShow = Math.min(PREVIEW_PAGES, numPages ?? PREVIEW_PAGES);

  return (
    <div id="pdf-preview-container" className="flex flex-col items-center gap-5 py-4">
      {loading && (
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-[12px] text-muted-foreground">Preview load ho raha hai...</p>
        </div>
      )}

      <Document
        file={url}
        onLoadSuccess={({ numPages: n }) => {
          setNumPages(n);
          setLoading(false);
        }}
        onLoadError={() => {
          setError(true);
          setLoading(false);
        }}
        loading={null}
        className="flex w-full flex-col items-center gap-4"
      >
        {Array.from({ length: pagesToShow }, (_, i) => (
          <div
            key={i + 1}
            className="relative w-full overflow-hidden rounded-xl border-2 border-ink/10 shadow-elevated"
          >
            <div className="absolute left-2 top-2 z-10 rounded-full bg-foreground/70 px-2 py-0.5 text-[9px] font-bold text-background">
              {i + 1}
            </div>
            <Page
              pageNumber={i + 1}
              width={pageWidth}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              className="block"
            />
          </div>
        ))}
      </Document>

      {!loading && numPages !== null && (
        <div className="rounded-full border-2 border-ink/10 bg-card px-4 py-1.5 text-[11px] font-bold text-muted-foreground">
          {numPages > PREVIEW_PAGES
            ? `First ${PREVIEW_PAGES} of ${numPages} pages • Download for full book`
            : `All ${numPages} pages shown`}
        </div>
      )}
    </div>
  );
}
