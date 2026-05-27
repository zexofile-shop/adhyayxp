import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchTests } from "@/lib/testApi";
import { buildCategories } from "@/lib/categories";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { ArrowRight, ChevronLeft, Newspaper, Sparkles, Calendar } from "lucide-react";
import logoVx from "@/assets/logo-vx.jpg";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "All Categories — VidyaX by EduSpark" },
      { name: "description", content: "Browse all test categories — JEE, NEET, GATE, Class 10 boards & more." },
      { property: "og:title", content: "All Categories — VidyaX" },
      { property: "og:description", content: "Pick a stream to see its mock tests." },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { data: tests, isLoading } = useQuery({ queryKey: ["tests"], queryFn: fetchTests });
  const categories = buildCategories(tests ?? []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="border-b-2 border-ink/10 bg-surface">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-14">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" /> Back to home
          </Link>
          <div className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-primary">All Categories</div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-5xl">
            What are you preparing for?
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
            Tap a category to see every test inside it.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl border-2 border-ink/10 bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {categories.map((c, i) => (
              <Link
                key={c.stream}
                to="/category/$stream"
                params={{ stream: encodeURIComponent(c.stream) }}
                className="group relative flex flex-col rounded-2xl border-2 border-ink/10 bg-card p-3.5 transition-all hover:-translate-y-0.5 hover:border-foreground hover:shadow-elevated sm:p-5"
                style={{ animation: `fade-up 0.45s ${i * 30}ms both` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-foreground p-0.5 shadow-soft ring-2 ring-ink/10 sm:h-12 sm:w-12">
                    <img src={logoVx} alt="AdhyayX" className="h-full w-full rounded-[10px] object-cover" />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-background tabular-nums">
                    {c.count}
                  </span>
                </div>
                <div className="mt-3 font-display text-sm font-bold leading-tight text-foreground sm:text-lg">
                  {c.label}
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground sm:text-sm">
                  {c.tagline}
                </p>
                <div className="mt-3 flex items-center justify-between border-t-2 border-dashed border-ink/10 pt-2.5 sm:mt-4 sm:pt-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:text-[11px]">
                    {c.count === 1 ? "1 test" : `${c.count} tests`}
                  </span>
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink/10 text-foreground transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary sm:h-9 sm:w-9">
                    <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Current Affairs + Daily News teaser — visually distinct from test cards */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border-2 border-ink bg-gradient-to-br from-foreground via-foreground to-primary p-6 text-background shadow-elevated sm:p-10">
          <div className="absolute inset-0 grid-bg opacity-15" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-primary-glow/30 blur-3xl" />
          <div className="relative grid items-center gap-6 sm:grid-cols-[1.3fr_1fr]">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-background/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-background/85 ring-1 ring-background/20">
                <Sparkles className="h-3 w-3" /> Beyond tests
              </span>
              <h2 className="mt-3 font-display text-2xl font-bold leading-tight sm:text-3xl">
                Daily News & <span className="text-primary-glow">Current Affairs</span>
              </h2>
              <p className="mt-2 max-w-md text-sm text-background/80">
                Pick any date and read that day's affairs digest with the latest news —
                curated for JEE, NEET, UPSC and competitive exams.
              </p>
              <Link
                to="/news"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-background px-5 py-3 text-xs font-bold text-foreground shadow-soft transition-transform hover:scale-[1.03] active:scale-95"
              >
                Explore today's digest
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-background/15 bg-background/10 p-4 backdrop-blur">
                <Calendar className="h-4 w-4 text-primary-glow" />
                <div className="mt-2 font-display text-lg font-bold">Date-wise</div>
                <div className="text-[11px] font-semibold text-background/70">
                  Jump to any day
                </div>
              </div>
              <div className="rounded-2xl border border-background/15 bg-background/10 p-4 backdrop-blur">
                <Newspaper className="h-4 w-4 text-primary-glow" />
                <div className="mt-2 font-display text-lg font-bold">Fresh news</div>
                <div className="text-[11px] font-semibold text-background/70">
                  Updated daily
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}