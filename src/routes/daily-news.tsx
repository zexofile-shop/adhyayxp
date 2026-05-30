import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ArrowRight,
  X,
  Newspaper,
} from "lucide-react";
import { fetchNews, newsDate } from "@/lib/affairsApi";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/daily-news")({
  head: () => ({
    meta: [
      { title: "Daily News — AdhyayX" },
      {
        name: "description",
        content: "Latest daily news stories, refreshed every day for competitive exam aspirants.",
      },
      { property: "og:title", content: "Daily News — AdhyayX" },
      { property: "og:description", content: "Pick a date and read that day's news stories." },
    ],
  }),
  component: DailyNewsPage,
});

function timeAgo(iso: string): string {
  const t = new Date((iso ?? "").replace(" ", "T")).getTime();
  if (!t) return "";
  const diff = (Date.now() - t) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function DailyNewsPage() {
  const [pages, setPages] = useState(2);
  const news = useQuery({ queryKey: ["news", pages], queryFn: () => fetchNews(pages) });

  const [pickedDate, setPickedDate] = useState<Date | undefined>(undefined);
  const [openId, setOpenId] = useState<number | null>(null);

  const all = news.data ?? [];
  const list = useMemo(() => {
    if (!pickedDate) return all;
    const key = format(pickedDate, "yyyy-MM-dd");
    return all.filter((n) => newsDate(n.createdAt) === key);
  }, [all, pickedDate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b-2 border-ink/10 bg-foreground text-background">
        <div className="absolute inset-0 grid-bg opacity-15" />
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/40 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-5 py-6 sm:px-6 sm:py-10">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-background/70 hover:text-background"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Home
          </Link>
          <h1 className="mt-3 font-display text-xl font-bold leading-tight sm:text-3xl">
            Daily News
          </h1>
          <p className="mt-1 max-w-xl text-xs text-background/75 sm:text-sm">
            The freshest stories, curated daily.
          </p>
        </div>
      </section>

      {/* Date picker */}
      <section className="sticky top-14 z-20 border-b-2 border-ink/10 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-5 py-3 sm:px-6">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-9 justify-start gap-2 rounded-full border-2 border-ink/15 px-3 text-xs font-bold",
                  !pickedDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                {pickedDate ? format(pickedDate, "d MMM yyyy") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={pickedDate}
                onSelect={(d) => setPickedDate(d ?? undefined)}
                disabled={(d) => d > new Date()}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          {pickedDate && (
            <button
              onClick={() => setPickedDate(undefined)}
              className="inline-flex h-9 items-center gap-1 rounded-full border-2 border-ink/10 bg-card px-3 text-[11px] font-bold text-foreground hover:border-foreground"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
          <div className="ml-auto text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {list.length} {list.length === 1 ? "story" : "stories"}
          </div>
        </div>
      </section>

      {/* List */}
      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {news.isLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-ink/15 bg-card p-8 text-center">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Newspaper className="h-4 w-4" />
            </span>
            <div className="mt-2 font-display text-sm font-bold">
              {pickedDate ? "No stories for this date" : "No stories available"}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {pickedDate
                ? "The news feed only covers the most recent days."
                : "Check back soon."}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {list.map((n) => {
              const isOpen = openId === n.id;
              const dt = new Date((n.createdAt ?? "").replace(" ", "T"));
              const dateLabel = isNaN(dt.getTime())
                ? ""
                : dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
              return (
                <article
                  key={n.id}
                  className={cn(
                    "group rounded-2xl border-2 bg-card transition-all",
                    isOpen ? "border-foreground shadow-soft" : "border-ink/10 hover:border-foreground hover:shadow-soft",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : n.id)}
                    className="flex w-full gap-3 p-3 text-left"
                    aria-expanded={isOpen}
                  >
                    {n.image ? (
                      <img
                        src={n.image}
                        alt=""
                        loading="lazy"
                        className="h-20 w-20 shrink-0 rounded-xl border border-ink/10 object-cover sm:h-24 sm:w-24"
                      />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-ink/10 bg-muted sm:h-24 sm:w-24">
                        <Newspaper className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-bold uppercase tracking-wider">
                        <span className="text-primary">{dateLabel}</span>
                        <span className="text-muted-foreground">· {timeAgo(n.createdAt)}</span>
                      </div>
                      <h3 className={cn(
                        "line-clamp-2 font-display text-xs font-bold leading-snug sm:text-sm",
                        isOpen ? "text-primary" : "text-foreground",
                      )}>
                        {n.title}
                      </h3>
                      {!isOpen && (
                        <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                          {n.summary}
                        </p>
                      )}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="border-t-2 border-dashed border-ink/10 px-3 pb-4 pt-3 sm:px-4">
                      {n.image && (
                        <img
                          src={n.image}
                          alt=""
                          loading="lazy"
                          className="mb-3 max-h-72 w-full rounded-xl border border-ink/10 object-cover"
                        />
                      )}
                      <p className="whitespace-pre-line text-[13px] leading-relaxed text-foreground">
                        {n.summary || "No additional details available."}
                      </p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {!pickedDate && !news.isLoading && list.length > 0 && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setPages((p) => p + 2)}
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2.5 text-xs font-bold text-background shadow-soft transition-transform hover:scale-[1.03]"
            >
              Load older news <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
