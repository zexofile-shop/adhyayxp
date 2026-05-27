import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import {
  ArrowRight,
  Calendar,
  ChevronLeft,
  Newspaper,
  Sparkles,
  X,
} from "lucide-react";
import {
  fetchAffairById,
  fetchAffairs,
  fetchNews,
  newsDate,
  type AffairListItem,
} from "@/lib/affairsApi";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "Current Affairs & Daily News — AdhyayX" },
      {
        name: "description",
        content:
          "Date-wise current affairs digests and daily news, curated for JEE, NEET, UPSC and other competitive exams.",
      },
      { property: "og:title", content: "Current Affairs & Daily News — AdhyayX" },
      {
        property: "og:description",
        content: "Pick any date and read that day's affairs digest + latest news.",
      },
    ],
  }),
  component: NewsPage,
});

function NewsPage() {
  const affairs = useQuery({ queryKey: ["affairs", 3], queryFn: () => fetchAffairs(3) });
  const news = useQuery({ queryKey: ["news", 2], queryFn: () => fetchNews(2) });

  // Available affair dates (descending)
  const dates = useMemo(() => {
    const arr = (affairs.data ?? []).map((a) => a.date).filter(Boolean);
    return Array.from(new Set(arr));
  }, [affairs.data]);

  const [selectedDate, setSelectedDate] = useState<string>("");

  const activeDate = selectedDate || dates[0] || "";

  const affairForDate: AffairListItem | undefined = useMemo(() => {
    return (affairs.data ?? []).find((a) => a.date === activeDate);
  }, [affairs.data, activeDate]);

  const newsForDate = useMemo(() => {
    if (!activeDate) return news.data ?? [];
    return (news.data ?? []).filter((n) => newsDate(n.createdAt) === activeDate);
  }, [news.data, activeDate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b-2 border-ink/10 bg-foreground text-background">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/40 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-14">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-background/70 hover:text-background"
          >
            <ChevronLeft className="h-4 w-4" /> Back to home
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-background/80 ring-1 ring-background/20">
              <Sparkles className="h-3 w-3" /> Daily knowledge
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-5xl">
            Current Affairs <span className="text-primary-glow">+</span> Daily News
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-background/75 sm:text-base">
            Pick any date and read that day's affairs digest with the freshest news,
            curated for competitive exams.
          </p>
        </div>
      </section>

      {/* Date strip */}
      <section className="sticky top-16 z-20 border-b-2 border-ink/10 bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Select date
            </div>
            {selectedDate && (
              <button
                onClick={() => setSelectedDate("")}
                className="ml-auto inline-flex items-center gap-1 rounded-full border-2 border-ink/10 bg-card px-2.5 py-1 text-[11px] font-bold text-foreground hover:border-foreground"
              >
                <X className="h-3 w-3" /> Latest
              </button>
            )}
          </div>
          {affairs.isLoading ? (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 w-20 shrink-0 animate-pulse rounded-xl bg-muted"
                />
              ))}
            </div>
          ) : (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {dates.slice(0, 30).map((d) => {
                const active = d === activeDate;
                const dt = new Date(d + "T00:00:00");
                const day = dt.getDate();
                const mo = dt.toLocaleString("en-US", { month: "short" });
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDate(d)}
                    className={`flex h-14 w-16 shrink-0 flex-col items-center justify-center rounded-xl border-2 text-center transition-all ${
                      active
                        ? "border-foreground bg-foreground text-background shadow-soft"
                        : "border-ink/10 bg-card text-foreground hover:border-foreground"
                    }`}
                  >
                    <span className="font-display text-base font-bold leading-none">{day}</span>
                    <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider opacity-80">
                      {mo}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Content grid */}
      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-10 sm:px-6 lg:grid-cols-[1.4fr_1fr]">
        {/* AFFAIRS column */}
        <div>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                Current Affairs Digest
              </div>
              <h2 className="mt-1 font-display text-2xl font-bold">
                {activeDate ? formatDate(activeDate) : "—"}
              </h2>
            </div>
          </div>
          {affairs.isLoading ? (
            <div className="h-72 animate-pulse rounded-2xl border-2 border-ink/10 bg-muted" />
          ) : affairForDate ? (
            <AffairCard id={affairForDate.id} title={affairForDate.title} />
          ) : (
            <EmptyCard
              icon={<Sparkles className="h-5 w-5" />}
              title="No digest published for this date"
              body="Try picking another date from the strip above."
            />
          )}
        </div>

        {/* NEWS column */}
        <div>
          <div className="mb-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              Daily News
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold">
              {newsForDate.length} stories
            </h2>
          </div>
          {news.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl border-2 border-ink/10 bg-muted" />
              ))}
            </div>
          ) : newsForDate.length === 0 ? (
            <EmptyCard
              icon={<Newspaper className="h-5 w-5" />}
              title="No stories for this date"
              body="The news feed only covers the most recent 1–2 days."
            />
          ) : (
            <div className="space-y-3">
              {newsForDate.map((n) => (
                <article
                  key={n.id}
                  className="group flex gap-3 rounded-2xl border-2 border-ink/10 bg-card p-3 transition-all hover:-translate-y-0.5 hover:border-foreground hover:shadow-soft"
                >
                  {n.image && (
                    <img
                      src={n.image}
                      alt=""
                      loading="lazy"
                      className="h-20 w-20 shrink-0 rounded-xl border border-ink/10 object-cover sm:h-24 sm:w-24"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-sm font-bold leading-snug text-foreground line-clamp-2">
                      {n.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {n.summary}
                    </p>
                    <div className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {timeAgo(n.createdAt)}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function AffairCard({ id, title }: { id: number; title: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["affair", id],
    queryFn: () => fetchAffairById(id),
  });
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-3xl border-2 border-ink/10 bg-card shadow-soft">
      <div className="relative bg-gradient-to-br from-foreground via-foreground to-primary p-6 text-background">
        <div className="absolute inset-0 grid-bg opacity-15" />
        <div className="relative">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-background/70">
            AdhyayX Digest
          </div>
          <h3 className="mt-1 font-display text-xl font-bold leading-tight sm:text-2xl">
            {title}
          </h3>
        </div>
      </div>
      <div className="p-5 sm:p-7">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 w-full animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : (data?.blocks?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">No content available.</p>
        ) : (
          <>
            <div
              className={`prose prose-sm max-w-none text-foreground ${open ? "" : "max-h-96 overflow-hidden"}`}
              style={{ lineHeight: 1.6 }}
            >
              {(data?.blocks ?? []).map((b, i) => (
                <div
                  key={i}
                  className="mb-4 rounded-xl border border-ink/10 bg-background/60 p-4 text-sm leading-relaxed [&_a]:text-primary [&_strong]:text-foreground"
                  dangerouslySetInnerHTML={{ __html: b }}
                />
              ))}
            </div>
            {(data?.blocks?.length ?? 0) > 2 && (
              <button
                onClick={() => setOpen((v) => !v)}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs font-bold text-background transition-transform hover:scale-[1.02]"
              >
                {open ? "Show less" : "Read full digest"}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-ink/15 bg-card p-10 text-center">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="mt-3 font-display text-base font-bold">{title}</div>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function timeAgo(iso: string): string {
  const t = new Date(iso.replace(" ", "T")).getTime();
  if (!t) return "";
  const diff = (Date.now() - t) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
