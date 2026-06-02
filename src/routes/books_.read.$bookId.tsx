import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  BookOpen,
} from "lucide-react";
import { fetchAllBooks } from "@/lib/booksApi";

function toFilename(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) + ".pdf"
  );
}

export const Route = createFileRoute("/books_/read/$bookId")({
  head: () => ({
    meta: [{ title: "Read Online — Edu's Khazana | AdhyayX" }],
  }),
  component: BookReaderPage,
});

function BookReaderPage() {
  const { bookId } = Route.useParams();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageWidth, setPageWidth] = useState(600);
  const [pdfReady, setPdfReady] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [inputVal, setInputVal] = useState("1");
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["books"],
    queryFn: fetchAllBooks,
    staleTime: 1000 * 60 * 60,
  });

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }, []);

  useEffect(() => {
    const update = () => {
      const el = containerRef.current;
      if (!el) return;
      const padding = window.innerWidth < 640 ? 16 : 48;
      setPageWidth(Math.min(el.clientWidth - padding, 820));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!numPages) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown")
        setCurrentPage((p) => Math.min(p + 1, numPages));
      if (e.key === "ArrowLeft" || e.key === "ArrowUp")
        setCurrentPage((p) => Math.max(p - 1, 1));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [numPages]);

  useEffect(() => {
    setInputVal(String(currentPage));
  }, [currentPage]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const book = data?.data.find((b) => b.id === bookId || b._id === bookId);
  if (!book) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-foreground text-background">
        <BookOpen className="h-12 w-12 opacity-30" />
        <p className="text-sm font-bold opacity-60">Book not found</p>
        <Link
          to="/books"
          className="rounded-full bg-background px-5 py-2 text-sm font-bold text-foreground"
        >
          Back to library
        </Link>
      </div>
    );
  }

  const bid = book.id || book._id;
  const upstreamId = book.downloadUrl?.split("/").pop() || bid;
  const filename = toFilename(book.title);
  const viewPath = `/api/books/dl/${upstreamId}?view=2&fn=${encodeURIComponent(filename)}`;
  const downloadPath = `/api/books/dl/${upstreamId}?fn=${encodeURIComponent(filename)}`;

  const goPrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const goNext = () =>
    setCurrentPage((p) => Math.min(p + 1, numPages ?? p));

  const handlePageInput = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(inputVal, 10);
    if (numPages && n >= 1 && n <= numPages) setCurrentPage(n);
    else setInputVal(String(currentPage));
  };

  const progress = numPages ? ((currentPage - 1) / (numPages - 1)) * 100 : 0;

  return (
    <div
      className="flex min-h-dvh flex-col bg-foreground text-background"
      style={{ touchAction: "pan-y" }}
    >
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center justify-between gap-2 border-b border-background/10 bg-foreground/95 px-3 backdrop-blur-md sm:px-5">
        <a
          href={`/books/${bid}`}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold text-background/70 transition-colors hover:bg-background/10 hover:text-background"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back
        </a>

        <p className="line-clamp-1 max-w-[40vw] text-center text-[11px] font-bold text-background/80 sm:max-w-xs">
          {book.title}
        </p>

        <a
          href={downloadPath}
          download={filename}
          className="inline-flex items-center gap-1 rounded-full border border-background/20 bg-background/10 px-3 py-1 text-[11px] font-bold text-background/80 transition-colors hover:bg-background/20 hover:text-background"
        >
          <Download className="h-3 w-3" />
          <span className="hidden sm:inline">Download</span>
        </a>
      </header>

      {/* ── Progress bar ── */}
      {numPages && (
        <div className="h-0.5 w-full bg-background/10">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* ── Page area ── */}
      <main
        ref={containerRef}
        className="flex flex-1 items-start justify-center overflow-y-auto px-2 py-4 sm:px-6 sm:py-6"
      >
        {pdfError ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-background/60">
            <BookOpen className="h-12 w-12" />
            <p className="text-sm font-bold">Could not load the PDF.</p>
            <a
              href={downloadPath}
              download={filename}
              className="rounded-full bg-background px-5 py-2 text-sm font-bold text-foreground"
            >
              Download instead
            </a>
          </div>
        ) : (
          <div className="w-full max-w-3xl">
            {!pdfReady && (
              <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-xs text-background/50">Loading book...</p>
              </div>
            )}

            <Document
              file={viewPath}
              onLoadSuccess={({ numPages: n }) => {
                setNumPages(n);
                setPdfReady(true);
              }}
              onLoadError={() => setPdfError(true)}
              loading={null}
            >
              <div
                className="overflow-hidden rounded-xl shadow-2xl"
                style={{ display: pdfReady ? "block" : "none" }}
              >
                <Page
                  key={currentPage}
                  pageNumber={currentPage}
                  width={pageWidth}
                  renderAnnotationLayer={false}
                  renderTextLayer={true}
                  className="block"
                />
              </div>
            </Document>
          </div>
        )}
      </main>

      {/* ── Bottom nav ── */}
      {pdfReady && numPages && (
        <footer className="sticky bottom-0 z-30 flex shrink-0 items-center justify-between gap-3 border-t border-background/10 bg-foreground/95 px-4 py-3 backdrop-blur-md sm:px-6">
          <button
            onClick={goPrev}
            disabled={currentPage === 1}
            className="inline-flex items-center gap-1.5 rounded-full border border-background/20 bg-background/10 px-4 py-2 text-xs font-bold text-background transition-colors hover:bg-background/20 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <form
            onSubmit={handlePageInput}
            className="flex items-center gap-1.5 text-xs font-bold text-background/80"
          >
            <input
              type="number"
              min={1}
              max={numPages}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onBlur={handlePageInput}
              className="w-12 rounded-lg border border-background/20 bg-background/10 px-1.5 py-1 text-center text-xs font-bold text-background outline-none focus:border-primary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="text-background/50">/ {numPages}</span>
          </form>

          <button
            onClick={goNext}
            disabled={currentPage === numPages}
            className="inline-flex items-center gap-1.5 rounded-full border border-background/20 bg-background/10 px-4 py-2 text-xs font-bold text-background transition-colors hover:bg-background/20 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </footer>
      )}
    </div>
  );
}
