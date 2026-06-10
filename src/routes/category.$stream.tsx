import { createFileRoute, Link } from "@tanstack/react-router";
import logoVx from "@/assets/logo-vx.jpg";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { fetchTests } from "@/lib/testApi";
import { getCategoryMeta } from "@/lib/categories";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { TestCard } from "@/components/site/TestCard";
import { ChevronLeft, Search } from "lucide-react";

export const Route = createFileRoute("/category/$stream")({
  head: ({ params }) => {
    const stream = decodeURIComponent(params.stream);
    return {
      meta: [
        { title: `${stream} Tests — AdhyayX` },
        { name: "description", content: `All ${stream} mock tests on AdhyayX.` },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { stream: encStream } = Route.useParams();
  const stream = decodeURIComponent(encStream);
  const meta = getCategoryMeta(stream);
  const { data: tests, isLoading } = useQuery({ queryKey: ["tests"], queryFn: fetchTests });
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const all = (tests ?? []).filter((t) => (t.stream ?? "General") === stream);
    if (!q) return all;
    return all.filter((t) => t.name.toLowerCase().includes(q.toLowerCase()));
  }, [tests, stream, q]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative overflow-hidden border-b-2 border-ink/10 bg-foreground text-background">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-14">
          <Link
            to="/categories"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-background/70 hover:text-background"
          >
            <ChevronLeft className="h-4 w-4" /> All categories
          </Link>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <div className="relative inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-background p-1 shadow-soft">
              <img src={logoVx} alt="AdhyayX" className="h-full w-full rounded-xl object-cover" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-background/60">Category</div>
              <h1 className="font-display text-3xl font-bold sm:text-4xl">{meta.label}</h1>
            </div>
          </div>
          <p className="mt-3 max-w-2xl text-sm text-background/75 sm:text-base">{meta.tagline}</p>

          <div className="relative mt-6 max-w-lg">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-background/60" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search tests in this category…"
              className="w-full rounded-full border-2 border-background/20 bg-background/10 py-3 pl-11 pr-4 text-sm font-medium text-background placeholder:text-background/50 outline-none transition-all focus:border-primary-glow focus:bg-background/15"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl border-2 border-ink/10 bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-ink/15 bg-card p-16 text-center">
            <div className="font-display text-lg font-bold">No tests yet</div>
            <p className="mt-1 text-sm text-muted-foreground">
              We haven't added tests for this filter. Try clearing your search.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-5 text-sm font-semibold text-muted-foreground">
              Showing <span className="text-foreground">{filtered.length}</span> tests
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((t, i) => (
                <TestCard key={t.id} test={t} index={i} />
              ))}
            </div>
          </>
        )}
      </section>

      <Footer />
    </div>
  );
}