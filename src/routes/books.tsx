import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Search, X, Download, Eye, ChevronLeft, BookOpen, Star } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { fetchAllBooks, formatBytes, type Book } from "@/lib/booksApi";
import eduKhajanaLogo from "@/assets/edu-khajana-logo.jpg";

export const Route = createFileRoute("/books")({
  head: () => ({
    meta: [
      { title: "Edu's Khazana — Free Books Library | AdhyayX" },
      {
        name: "description",
        content:
          "Browse 770+ free competitive-exam books — SSC, Bank, UPSC, NDA, JEE, NEET. Powered by EduSpark.",
      },
      { property: "og:title", content: "Edu's Khazana — Free Books Library" },
      { property: "og:description", content: "770+ free competitive-exam books — view & download." },
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="p-10 text-center text-sm text-muted-foreground">
      Couldn't load books: {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-10 text-center">No books found.</div>,
  component: BooksPage,
});

function BooksPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["books"],
    queryFn: fetchAllBooks,
    staleTime: 1000 * 60 * 60,
  });

  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const all = data?.data ?? [];
  const total = data?.total ?? 0;

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return all;
    return all.filter((b) => {
      const hay = [
        b.title,
        b.author,
        b.publisher,
        b.shortDescription,
        ...(b.subject ?? []),
        ...(b.genre ?? []),
        ...(b.examRelevance ?? []),
        ...(b.tags ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(term);
    });
  }, [all, q]);

  const PAGE = 24;
  const [shown, setShown] = useState(PAGE);
  useEffect(() => {
    setShown(PAGE);
  }, [q]);
  useEffect(() => {
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 600) {
        setShown((s) => (s < filtered.length ? s + PAGE : s));
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [filtered.length]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative overflow-hidden border-b-2 border-ink/10 bg-foreground text-background">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
          <Link
            to="/categories"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-background/70 hover:text-background"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-background p-1 shadow-soft sm:h-20 sm:w-20">
              <img
                src={eduKhajanaLogo}
                alt="Edu's Khazana"
                className="h-full w-full rounded-xl object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-glow">
                Powered by EduSpark
              </div>
              <h1 className="font-display text-2xl font-bold sm:text-4xl">Edu's Khazana</h1>
              <p className="mt-1 text-xs text-background/70 sm:text-sm">
                Free books for every competitive aspirant
              </p>
            </div>
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search books"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-background/20 bg-background/10 text-background transition hover:bg-background/20"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-background/20 bg-background/10 px-3 py-1.5 text-[11px] font-bold tabular-nums text-background sm:text-xs">
            <BookOpen className="h-3.5 w-3.5" />
            {q
              ? `Showing ${filtered.length} books out of ${total}`
              : `Showing ${total} books`}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-10">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-2xl border-2 border-ink/10 bg-muted"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-ink/15 bg-card p-12 text-center">
            <div className="font-display text-lg font-bold">No matches</div>
            <p className="mt-1 text-sm text-muted-foreground">Try a different keyword.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {filtered.slice(0, shown).map((b, i) => (
              <BookCard key={b.id} book={b} index={i} />
            ))}
          </div>
        )}
      </section>

      {searchOpen && (
        <SearchOverlay
          q={q}
          setQ={setQ}
          onClose={() => setSearchOpen(false)}
          total={total}
          count={filtered.length}
          results={filtered.slice(0, 20)}
        />
      )}

      <Footer />
    </div>
  );
}

function BookCard({ book, index }: { book: Book; index: number }) {
  const bid = book.id || book._id;
  const proxyDownload = `/api/books/dl/${bid}`;

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-2xl border-2 border-ink/10 bg-card transition-all hover:-translate-y-0.5 hover:border-foreground hover:shadow-elevated"
      style={{ animation: `fade-up 0.4s ${index * 20}ms both` }}
    >
      <Link
        to="/books/$bookId"
        params={{ bookId: bid }}
        className="relative block aspect-[3/4] overflow-hidden bg-muted"
      >
        {book.thumbnailUrl ? (
          <img
            src={book.thumbnailUrl}
            alt={book.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}
        {book.isFeatured && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-foreground px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-background">
            <Star className="h-2.5 w-2.5" /> Featured
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-2.5 sm:p-3">
        <div className="line-clamp-2 font-display text-[12px] font-bold leading-snug sm:text-sm">
          {book.title}
        </div>
        {book.author && (
          <div className="line-clamp-1 text-[10px] text-muted-foreground sm:text-[11px]">
            by {book.author}
          </div>
        )}
        <div className="mt-auto grid grid-cols-2 gap-1.5 pt-1">
          <Link
            to="/books/$bookId"
            params={{ bookId: bid }}
            className="inline-flex items-center justify-center gap-1 rounded-full border-2 border-ink/10 bg-background px-2 py-1.5 text-[10px] font-bold transition-colors hover:border-foreground sm:text-[11px]"
          >
            <Eye className="h-3 w-3" /> View
          </Link>
          <a
            href={proxyDownload}
            download={`adhyayx-${bid}.pdf`}
            className="inline-flex items-center justify-center gap-1 rounded-full bg-foreground px-2 py-1.5 text-[10px] font-bold text-background transition-opacity hover:opacity-90 sm:text-[11px]"
          >
            <Download className="h-3 w-3" /> Get
          </a>
        </div>
        <div className="flex items-center justify-between text-[9px] text-muted-foreground tabular-nums sm:text-[10px]">
          <span>{book.totalPages ? `${book.totalPages}p` : "—"}</span>
          <span>{formatBytes(book.compressedSizeBytes)}</span>
        </div>
      </div>
    </div>
  );
}

function SearchOverlay({
  q,
  setQ,
  onClose,
  total,
  count,
  results,
}: {
  q: string;
  setQ: (v: string) => void;
  onClose: () => void;
  total: number;
  count: number;
  results: Book[];
}) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background">
      <div className="flex items-center gap-2 border-b-2 border-ink/10 bg-card px-3 py-3 sm:px-6">
        <Search className="h-5 w-5 text-muted-foreground" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search 770+ books — title, author, exam, subject…"
          className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground sm:text-base"
        />
        <button
          onClick={onClose}
          aria-label="Close search"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink/10 hover:border-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="border-b border-ink/10 bg-surface px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground sm:px-6">
        {q ? `Showing ${count} books out of ${total}` : `Type to search • ${total} books`}
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-6">
        {q && results.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No matches.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {(q ? results : []).map((b) => (
              <Link
                key={b.id}
                to="/books/$bookId"
                params={{ bookId: b.id || b._id }}
                onClick={onClose}
                className="group flex flex-col overflow-hidden rounded-xl border-2 border-ink/10 bg-card transition-all hover:-translate-y-0.5 hover:border-foreground"
              >
                <div className="aspect-[3/4] overflow-hidden bg-muted">
                  {b.thumbnailUrl && (
                    <img
                      src={b.thumbnailUrl}
                      alt={b.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="p-2">
                  <div className="line-clamp-2 text-[11px] font-bold leading-snug">{b.title}</div>
                  {b.author && (
                    <div className="line-clamp-1 text-[10px] text-muted-foreground">
                      by {b.author}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
