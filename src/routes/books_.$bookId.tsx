import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, Suspense, lazy } from "react";
import {
  ChevronLeft,
  Download,
  BookOpenCheck,
  Calendar,
  Globe,
  User,
  Building2,
  Layers,
  BookOpen,
  FileText,
} from "lucide-react";
import { useLiveBookPages } from "@/lib/stats";
import { probePdfPageCount } from "@/lib/pdfPages";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { fetchAllBooks, formatBytes } from "@/lib/booksApi";

const BookPDFPreview = lazy(() =>
  import("@/components/site/BookPDFPreview").then((m) => ({ default: m.BookPDFPreview }))
);

function toFilename(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) + ".pdf"
  );
}

export const Route = createFileRoute("/books_/$bookId")({
  head: ({ params }) => ({
    meta: [
      { title: `Book — Edu's Khazana | AdhyayX` },
      {
        name: "description",
        content: "Free book on Edu's Khazana — view details and download.",
      },
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="p-10 text-center text-sm text-muted-foreground">
      Could not load book: {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="p-10 text-center">
      <div className="font-display text-2xl font-bold">Book not found</div>
      <Link to="/books" className="mt-4 inline-block text-sm font-bold text-primary">
        ← Back to library
      </Link>
    </div>
  ),
  component: BookDetailPage,
});

function BookDetailPage() {
  const params = Route.useParams();
  const routeBookId = params.bookId;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["books"],
    queryFn: fetchAllBooks,
    staleTime: 1000 * 60 * 60,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-5xl p-6">
          <div className="h-96 animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
    );
  }

  const book = data?.data.find(
    (b) => b.id === routeBookId || b._id === routeBookId
  );
  if (!book) throw notFound();

  const bid = book.id || book._id;
  const upstreamId = book.downloadUrl?.split("/").pop();
  const filename = toFilename(book.title);
  const hasDirectDownload = !!upstreamId;
  const downloadPath = hasDirectDownload
    ? `/api/books/dl/${upstreamId}?fn=${encodeURIComponent(filename)}`
    : (book.externalDownloadUrl ?? null);
  const viewPath = hasDirectDownload
    ? `/api/books/dl/${upstreamId}?view=2&fn=${encodeURIComponent(filename)}`
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── Hero / Details ── */}
      <section className="border-b-2 border-ink/10 bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
          <Link
            to="/books"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" /> Edu's Khazana
          </Link>

          <div className="mt-5 grid gap-6 sm:grid-cols-[220px_1fr] sm:gap-8">
            {/* Cover */}
            <div className="mx-auto w-40 sm:mx-0 sm:w-full">
              <div className="aspect-[3/4] overflow-hidden rounded-2xl border-2 border-ink/10 bg-muted shadow-elevated">
                {book.thumbnailUrl ? (
                  <img
                    src={book.thumbnailUrl}
                    alt={book.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <BookOpen className="h-16 w-16 text-muted-foreground/40" />
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="min-w-0">
              <h1 className="mt-2 font-display text-2xl font-bold leading-tight sm:text-4xl">
                {book.title}
              </h1>
              {book.shortDescription && (
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                  {book.shortDescription}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground sm:text-sm">
                {book.author && (
                  <Meta icon={<User className="h-3.5 w-3.5" />} label={book.author} />
                )}
                {book.publisher && (
                  <Meta icon={<Building2 className="h-3.5 w-3.5" />} label={book.publisher} />
                )}
                {book.language && (
                  <Meta icon={<Globe className="h-3.5 w-3.5" />} label={book.language} />
                )}
                {book.yearPublished && (
                  <Meta
                    icon={<Calendar className="h-3.5 w-3.5" />}
                    label={String(book.yearPublished)}
                  />
                )}
                {book.difficulty && (
                  <Meta
                    icon={<Layers className="h-3.5 w-3.5" />}
                    label={book.difficulty.charAt(0).toUpperCase() + book.difficulty.slice(1)}
                  />
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-5 flex flex-wrap gap-3">
                {downloadPath ? (
                  <a
                    href={downloadPath}
                    download={hasDirectDownload ? filename : undefined}
                    target={hasDirectDownload ? undefined : "_blank"}
                    rel={hasDirectDownload ? undefined : "noopener noreferrer"}
                    className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-bold text-background shadow-elevated transition-opacity hover:opacity-90"
                  >
                    <Download className="h-4 w-4" /> Download PDF
                  </a>
                ) : null}
                {hasDirectDownload ? (
                  <a
                    href={`/books/read/${bid}`}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-ink/15 bg-card px-5 py-2.5 text-sm font-bold transition-colors hover:border-foreground"
                  >
                    <BookOpenCheck className="h-4 w-4" /> Read Online
                  </a>
                ) : null}
              </div>

              {/* Real book info pills — only verified data, no fake stats */}
              <div className="mt-4 flex flex-wrap gap-2">
                {book.compressedSizeBytes ? (
                  <InfoPill label="File Size" value={formatBytes(book.compressedSizeBytes)} />
                ) : null}
                {book.language ? (
                  <InfoPill label="Language" value={book.language} />
                ) : null}
                {book.yearPublished ? (
                  <InfoPill label="Year" value={String(book.yearPublished)} />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tags / Description ── */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {(book.genre?.length || book.subject?.length || book.examRelevance?.length) ? (
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            {book.genre?.length ? <TagBlock title="Genre" items={book.genre} /> : null}
            {book.subject?.length ? <TagBlock title="Subjects" items={book.subject} /> : null}
            {book.examRelevance?.length ? (
              <TagBlock title="Exam Relevance" items={book.examRelevance} />
            ) : null}
          </div>
        ) : null}

        {book.description && (
          <article className="mb-10 rounded-2xl border-2 border-ink/10 bg-card p-5 sm:p-7">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              About this book
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 sm:text-[15px]">
              {book.description}
            </p>
          </article>
        )}

        {/* ── PDF Preview ── */}
        <div id="preview" className="scroll-mt-20 rounded-2xl border-2 border-ink/10 bg-card p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                Read Online
              </div>
              <h2 className="font-display text-lg font-bold sm:text-xl">
                {hasDirectDownload ? "First 15 pages preview" : "Preview unavailable"}
              </h2>
            </div>
            {downloadPath ? (
              <a
                href={downloadPath}
                download={hasDirectDownload ? filename : undefined}
                target={hasDirectDownload ? undefined : "_blank"}
                rel={hasDirectDownload ? undefined : "noopener noreferrer"}
                className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-[11px] font-bold text-background transition-opacity hover:opacity-90"
              >
                <Download className="h-3.5 w-3.5" /> Download Full PDF
              </a>
            ) : null}
          </div>

          {hasDirectDownload ? (
            mounted ? (
              <Suspense
                fallback={
                  <div className="flex h-64 flex-col items-center justify-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-xs text-muted-foreground">Loading preview...</p>
                  </div>
                }
              >
                <BookPDFPreview url={viewPath!} />
              </Suspense>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-xs text-muted-foreground">Loading preview...</p>
              </div>
            )
          ) : (
            <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-ink/15 text-sm text-muted-foreground">
              <BookOpen className="h-8 w-8 opacity-30" />
              <p>In-browser preview not available for this book.</p>
              {downloadPath && (
                <a
                  href={downloadPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-[11px] font-bold text-background transition-opacity hover:opacity-90"
                >
                  <Download className="h-3.5 w-3.5" /> Download to read
                </a>
              )}
            </div>
          )}

          {hasDirectDownload && (
            <p className="mt-4 text-[11px] text-muted-foreground">
              Use arrow keys or buttons to flip pages. Download for the complete book.
            </p>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Meta({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {icon}
      <span className="truncate">{label}</span>
    </span>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex items-baseline gap-1.5 rounded-full border-2 border-ink/10 bg-surface px-3 py-1">
      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="font-display text-xs font-bold tabular-nums">{value}</span>
    </div>
  );
}

function TagBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border-2 border-ink/10 bg-card p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{title}</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((t) => (
          <span
            key={t}
            className="inline-flex items-center rounded-full border border-ink/10 bg-surface px-2 py-0.5 text-[10px] font-semibold sm:text-[11px]"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
