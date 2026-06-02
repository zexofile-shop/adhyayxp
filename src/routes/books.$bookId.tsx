import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  Download,
  Eye,
  BookOpen,
  Star,
  Calendar,
  FileText,
  Globe,
  User,
  Building2,
} from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { fetchAllBooks, formatBytes } from "@/lib/booksApi";

export const Route = createFileRoute("/books/$bookId")({
  head: ({ params }) => ({
    meta: [
      { title: `Book ${params.bookId} — Edu's Khazana | AdhyayX` },
      {
        name: "description",
        content: "Free book on Edu's Khazana — view details and download.",
      },
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="p-10 text-center text-sm text-muted-foreground">
      Couldn't load book: {error.message}
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
  // NOTE: destructure mat karo, warna TanStack code-splitter
  // `bookId` ko duplicate-declare kar deta hai (build error aata hai).
  const params = Route.useParams();
  const routeBookId = params.bookId;

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
  // Yeh URLs aapke OWN domain pe jaati hain — upstream URL chhupi rehti hai.
  const downloadPath = `/api/books/dl/${bid}`;
  const viewPath = `${downloadPath}?view=2`;
  // Preview ke liye bhi same inline URL use kar rahe hain (full PDF).
  const previewPath = viewPath;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="border-b-2 border-ink/10 bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
          <Link
            to="/books"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" /> Edu's Khazana
          </Link>

          <div className="mt-5 grid gap-6 sm:grid-cols-[220px_1fr] sm:gap-8">
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

            <div className="min-w-0">
              {book.isFeatured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-background">
                  <Star className="h-3 w-3" /> Featured
                </span>
              )}
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
                {book.totalPages && (
                  <Meta
                    icon={<FileText className="h-3.5 w-3.5" />}
                    label={`${book.totalPages} pages`}
                  />
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={downloadPath}
                  download={`adhyayx-${bid}.pdf`}
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-bold text-background shadow-elevated transition-opacity hover:opacity-90"
                >
                  <Download className="h-4 w-4" /> Download PDF
                </a>
                <a
                  href={viewPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-ink/15 bg-card px-5 py-2.5 text-sm font-bold transition-colors hover:border-foreground"
                >
                  <Eye className="h-4 w-4" /> Open full PDF
                </a>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center sm:max-w-md">
                <Stat label="Size" value={formatBytes(book.compressedSizeBytes)} />
                <Stat
                  label="Downloads"
                  value={(book.downloadCount ?? 0).toLocaleString("en-IN")}
                />
                <Stat label="Views" value={(book.viewCount ?? 0).toLocaleString("en-IN")} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {(book.genre?.length || book.subject?.length || book.examRelevance?.length) ? (
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            {book.genre?.length ? <TagBlock title="Genre" items={book.genre} /> : null}
            {book.subject?.length ? <TagBlock title="Subjects" items={book.subject} /> : null}
            {book.examRelevance?.length ? (
              <TagBlock title="Exam relevance" items={book.examRelevance} />
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

        <div id="preview" className="rounded-2xl border-2 border-ink/10 bg-card p-3 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                Preview
              </div>
              <h2 className="font-display text-lg font-bold sm:text-xl">
                Full book preview
              </h2>
            </div>
            <a
              href={downloadPath}
              download={`adhyayx-${bid}.pdf`}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink/10 bg-background px-3 py-1.5 text-[11px] font-bold transition-colors hover:border-foreground"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </a>
          </div>
          <div className="overflow-hidden rounded-xl border-2 border-ink/10 bg-muted">
            <iframe
              src={previewPath}
              title={`${book.title} preview`}
              className="h-[70vh] w-full sm:h-[80vh]"
            />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Browser ke PDF viewer mein scroll karke pura book padh sakte hain. Save karne ke liye Download dabao.
          </p>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border-2 border-ink/10 bg-card p-2.5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 font-display text-sm font-bold tabular-nums sm:text-base">
        {value}
      </div>
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
