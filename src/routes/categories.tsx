import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { fetchTests } from "@/lib/testApi";
import { buildCategories } from "@/lib/categories";
import { fetchPwTotalBatches, fetchPwTotalTests } from "@/lib/pwApi";
import { useLiveStat, publishStat } from "@/lib/stats";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { AffairsNewsPreview } from "@/components/site/AffairsNewsPreview";
import { ArrowRight, ChevronLeft, Zap } from "lucide-react";
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
  const pwBatches = useLiveStat("pwBatches", 0);
  const pwTests = useLiveStat("pwTests", 0);

  useEffect(() => {
    fetchPwTotalBatches().then((n) => publishStat("pwBatches", n)).catch(() => {});
    fetchPwTotalTests().then((n) => publishStat("pwTests", n)).catch(() => {});
  }, []);

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

      {/* Current Affairs + Daily News — ABOVE tests, two clean separate boxes */}
      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-10">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              Stay current
            </div>
            <h2 className="mt-1 font-display text-xl font-bold sm:text-2xl">
              Today's digest &amp; news
            </h2>
          </div>
          <Link
            to="/current-affairs"
            className="hidden items-center gap-1.5 rounded-full border-2 border-ink/10 bg-card px-3.5 py-2 text-xs font-bold text-foreground transition-colors hover:border-foreground sm:inline-flex"
          >
            Open <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <AffairsNewsPreview />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="mb-5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
          Test categories
        </div>
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


      <Footer />
    </div>
  );
}