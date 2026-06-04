import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

const PREVIEW_PAGES = 15;

const PDF_OPTIONS = {
  disableStream: false,
  disableAutoFetch: false,
  rangeChunkSize: 65536,
};

export function BookPDFPreview({ url }: { url: string }) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pageWidth, setPageWidth] = useState(640);

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    const updateWidth = () => {
      const el = document.getElementById("pdf-slide-container");
      setPageWidth(el ? el.clientWidth : Math.min(window.innerWidth - 40, 720));
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!numPages) return;
      const total = Math.min(PREVIEW_PAGES, numPages);
      if (e.key === "ArrowRight" || e.key === "ArrowDown")
        setCurrentPage((p) => Math.min(p + 1, total));
      if (e.key === "ArrowLeft" || e.key === "ArrowUp")
        setCurrentPage((p) => Math.max(p - 1, 1));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [numPages]);

  const totalPreview = Math.min(PREVIEW_PAGES, numPages ?? PREVIEW_PAGES);
  const goPrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const goNext = () => setCurrentPage((p) => Math.min(p + 1, totalPreview));

  if (error) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-ink/15 text-sm text-muted-foreground">
        <BookOpen className="h-8 w-8 opacity-30" />
        <p>Preview could not be loaded. Please download to read.</p>
      </div>
    );
  }

  return (
    <div id="pdf-slide-container" className="select-none">
      <div className="relative overflow-hidden rounded-2xl border-2 border-ink/10 bg-muted shadow-elevated min-h-[200px]">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-muted">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-xs text-muted-foreground">Loading preview...</p>
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
          options={PDF_OPTIONS}
        >
          <Page
            key={currentPage}
            pageNumber={currentPage}
            width={pageWidth}
            renderAnnotationLayer={false}
            renderTextLayer={false}
            className="block"
          />
        </Document>
      </div>

      {!loading && numPages !== null && (
        <>
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              onClick={goPrev}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink/15 px-4 py-2 text-sm font-bold transition-colors hover:border-foreground disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>

            <div className="flex flex-col items-center">
              <span className="font-display text-sm font-bold tabular-nums">
                {currentPage} / {totalPreview}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {numPages > PREVIEW_PAGES
                  ? `Preview · ${numPages} pages in full book`
                  : `${numPages} pages total`}
              </span>
            </div>

            <button
              onClick={goNext}
              disabled={currentPage === totalPreview}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink/15 px-4 py-2 text-sm font-bold transition-colors hover:border-foreground disabled:cursor-not-allowed disabled:opacity-30"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {totalPreview <= 15 && (
            <div className="mt-3 flex justify-center gap-1.5">
              {Array.from({ length: totalPreview }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  aria-label={`Go to page ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i + 1 === currentPage
                      ? "w-6 bg-foreground"
                      : "w-1.5 bg-ink/20 hover:bg-ink/40"
                  }`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
