import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  BookOpen,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  Coffee,
  Maximize,
} from "lucide-react";
import { fetchAllBooks } from "@/lib/booksApi";
import { publishBookPages } from "@/lib/stats";

function toFilename(title: string): string {
  return (
    "AdhyayX - " +
    title
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100) +
    ".pdf"
  );
}

const PDF_OPTIONS = {
  disableStream: false,
  disableAutoFetch: true,
  rangeChunkSize: 32768,
};

type Theme = "light" | "sepia" | "dark";

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
  const [containerWidth, setContainerWidth] = useState(700);
  const [zoom, setZoom] = useState(1);
  const [fitWidth, setFitWidth] = useState(true);
  const [pdfReady, setPdfReady] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [inputVal, setInputVal] = useState("1");
  const [theme, setTheme] = useState<Theme>("light");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["books"],
    queryFn: fetchAllBooks,
    staleTime: 1000 * 60 * 60,
  });

  // Configure pdfjs worker once
  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }, []);

  // Measure container width via ResizeObserver — prevents zoom glitch
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const padding = window.innerWidth < 640 ? 16 : 48;
      setContainerWidth(Math.min(el.clientWidth - padding, 900));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Keyboard navigation + shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!numPages) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        setCurrentPage((p) => Math.min(p + 1, numPages));
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setCurrentPage((p) => Math.max(p - 1, 1));
      }
      if (e.key === "Home") setCurrentPage(1);
      if (e.key === "End") setCurrentPage(numPages);
      if (e.key === "+" || e.key === "=") {
        setFitWidth(false);
        setZoom((z) => Math.min(z + 0.15, 3));
      }
      if (e.key === "-" || e.key === "_") {
        setFitWidth(false);
        setZoom((z) => Math.max(z - 0.15, 0.5));
      }
      if (e.key === "0") {
        setZoom(1);
        setFitWidth(true);
      }
      if (e.key.toLowerCase() === "f") toggleFullscreen();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [numPages]);

  // Fullscreen tracking
  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    setInputVal(String(currentPage));
  }, [currentPage]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

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
  const upstreamId = book.downloadUrl?.split("/").pop();
  const filename = toFilename(book.title);
  const hasDirectDownload = !!upstreamId;
  const viewPath = hasDirectDownload
    ? `/api/books/dl/${upstreamId}?view=2&fn=${encodeURIComponent(filename)}`
    : null;
  const downloadPath = hasDirectDownload
    ? `/api/books/dl/${upstreamId}?fn=${encodeURIComponent(filename)}`
    : (book.externalDownloadUrl ?? null);

  const goPrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const goNext = () => setCurrentPage((p) => Math.min(p + 1, numPages ?? p));

  const handlePageInput = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(inputVal, 10);
    if (numPages && n >= 1 && n <= numPages) setCurrentPage(n);
    else setInputVal(String(currentPage));
  };

  const progress = numPages ? ((currentPage - 1) / Math.max(numPages - 1, 1)) * 100 : 0;
  const effectiveWidth = fitWidth ? containerWidth : containerWidth * zoom;

  const themeBg =
    theme === "dark" ? "bg-[#0a0a0a]" : theme === "sepia" ? "bg-[#f4ecd8]" : "bg-foreground";
  const themeText =
    theme === "dark" ? "text-white" : theme === "sepia" ? "text-[#3d2e1a]" : "text-background";
  const themeAccent =
    theme === "dark"
      ? "border-white/10"
      : theme === "sepia"
        ? "border-[#3d2e1a]/15"
        : "border-background/10";
  const pageFilter =
    theme === "dark"
      ? { filter: "invert(0.92) hue-rotate(180deg)" }
      : theme === "sepia"
        ? { filter: "sepia(0.35) saturate(0.85)" }
        : undefined;

  return (
    <div className={`flex min-h-dvh flex-col ${themeBg} ${themeText}`} style={{ touchAction: "pan-y" }}>
      {/* Top bar */}
      <header
        className={`sticky top-0 z-30 flex h-12 shrink-0 items-center justify-between gap-2 border-b ${themeAccent} backdrop-blur-md px-3 sm:px-5`}
        style={{ backgroundColor: "color-mix(in oklch, currentColor 4%, transparent)" }}
      >
        <a
          href={`/books/${bid}`}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold opacity-70 transition-opacity hover:opacity-100"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back
        </a>

        <p className="line-clamp-1 max-w-[40vw] text-center text-[11px] font-bold opacity-90 sm:max-w-md">
          {book.title}
        </p>

        <div className="flex items-center gap-1">
          {/* Theme cycle */}
          <button
            onClick={() =>
              setTheme((t) => (t === "light" ? "sepia" : t === "sepia" ? "dark" : "light"))
            }
            title={`Theme: ${theme}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-current/20 opacity-80 transition-opacity hover:opacity-100"
          >
            {theme === "light" ? (
              <Sun className="h-3.5 w-3.5" />
            ) : theme === "sepia" ? (
              <Coffee className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            title="Fullscreen (F)"
            className="hidden h-8 w-8 items-center justify-center rounded-full border border-current/20 opacity-80 transition-opacity hover:opacity-100 sm:inline-flex"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
          </button>

          {downloadPath ? (
            <a
              href={downloadPath}
              download={hasDirectDownload ? filename : undefined}
              target={hasDirectDownload ? undefined : "_blank"}
              rel={hasDirectDownload ? undefined : "noopener noreferrer"}
              className="ml-1 inline-flex items-center gap-1 rounded-full border border-current/20 bg-current/10 px-3 py-1 text-[11px] font-bold opacity-90 transition-opacity hover:opacity-100"
            >
              <Download className="h-3 w-3" />
              <span className="hidden sm:inline">Download</span>
            </a>
          ) : null}
        </div>
      </header>

      {/* Progress bar */}
      {numPages && (
        <div className="h-0.5 w-full bg-current/10">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Page area */}
      <main
        ref={containerRef}
        className="flex flex-1 items-start justify-center overflow-auto px-2 py-4 sm:px-6 sm:py-6"
      >
        {!viewPath || pdfError ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 opacity-70">
            <BookOpen className="h-12 w-12" />
            <p className="text-sm font-bold">
              {pdfError ? "Could not load the PDF." : "Online reader not available."}
            </p>
            {downloadPath ? (
              <a
                href={downloadPath}
                download={hasDirectDownload ? filename : undefined}
                target={hasDirectDownload ? undefined : "_blank"}
                rel={hasDirectDownload ? undefined : "noopener noreferrer"}
                className="rounded-full bg-current/20 px-5 py-2 text-sm font-bold"
              >
                Download instead
              </a>
            ) : null}
          </div>
        ) : (
          <div className="w-full max-w-4xl">
            {!pdfReady && (
              <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-xs opacity-60">Loading first page…</p>
              </div>
            )}

            <Document
              file={viewPath}
              onLoadSuccess={({ numPages: n }) => {
                setNumPages(n);
                setPdfReady(true);
                publishBookPages(bid, n);
              }}
              onLoadError={() => setPdfError(true)}
              loading={null}
              options={PDF_OPTIONS}
            >
              <div
                className="mx-auto overflow-hidden rounded-xl shadow-2xl"
                style={{ display: pdfReady ? "block" : "none", width: "fit-content", ...pageFilter }}
              >
                <Page
                  key={`${currentPage}-${effectiveWidth}`}
                  pageNumber={currentPage}
                  width={effectiveWidth}
                  renderAnnotationLayer={false}
                  renderTextLayer={true}
                  className="block"
                />
              </div>
            </Document>
          </div>
        )}
      </main>

      {/* Bottom nav with zoom controls */}
      {pdfReady && numPages && (
        <footer
          className={`sticky bottom-0 z-30 flex shrink-0 items-center justify-between gap-2 border-t ${themeAccent} backdrop-blur-md px-3 py-2.5 sm:px-6`}
          style={{ backgroundColor: "color-mix(in oklch, currentColor 4%, transparent)" }}
        >
          <button
            onClick={goPrev}
            disabled={currentPage === 1}
            className="inline-flex items-center gap-1.5 rounded-full border border-current/20 bg-current/10 px-3 py-1.5 text-xs font-bold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30 sm:px-4 sm:py-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setFitWidth(false);
                setZoom((z) => Math.max(z - 0.15, 0.5));
              }}
              title="Zoom out (-)"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-current/20 opacity-80 hover:opacity-100"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setFitWidth(true);
              }}
              title="Fit width (0)"
              className="hidden h-7 items-center justify-center rounded-full border border-current/20 px-2 text-[10px] font-bold opacity-80 hover:opacity-100 sm:inline-flex"
            >
              {fitWidth ? "Fit" : `${Math.round(zoom * 100)}%`}
            </button>
            <button
              onClick={() => {
                setFitWidth(false);
                setZoom((z) => Math.min(z + 0.15, 3));
              }}
              title="Zoom in (+)"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-current/20 opacity-80 hover:opacity-100"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>

            <form
              onSubmit={handlePageInput}
              className="ml-2 flex items-center gap-1.5 text-xs font-bold opacity-90"
            >
              <input
                type="number"
                min={1}
                max={numPages}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onBlur={handlePageInput}
                className="w-12 rounded-lg border border-current/20 bg-current/10 px-1.5 py-1 text-center text-xs font-bold outline-none focus:border-primary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                style={{ color: "inherit", backgroundColor: "transparent" }}
              />
              <span className="opacity-60">/ {numPages}</span>
            </form>
          </div>

          <button
            onClick={goNext}
            disabled={currentPage === numPages}
            className="inline-flex items-center gap-1.5 rounded-full border border-current/20 bg-current/10 px-3 py-1.5 text-xs font-bold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30 sm:px-4 sm:py-2"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </footer>
      )}
    </div>
  );
}
