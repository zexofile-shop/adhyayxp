import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchTests } from "@/lib/testApi";
import { buildCategories } from "@/lib/categories";
import { fetchPwTotalTests } from "@/lib/pwApi";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  BarChart3,
  Brain,
  Newspaper,
  Calendar,
  GraduationCap,
  Plus,
  HelpCircle,
} from "lucide-react";
import logoVx from "@/assets/logo-vx.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AdhyayX — Har Adhyay, Ek Nayi Jeet" },
      {
        name: "description",
        content:
          "Exam-grade mocks plus daily news & current affairs for JEE, NEET, boards and competitive exams.",
      },
      { property: "og:title", content: "AdhyayX — Har Adhyay, Ek Nayi Jeet" },
      {
        property: "og:description",
        content:
          "Exam-grade mocks plus daily news & current affairs for JEE, NEET, boards and competitive exams.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: tests, isLoading } = useQuery({ queryKey: ["tests"], queryFn: fetchTests });
  const categories = buildCategories(tests ?? []);
  const totalTests = tests?.length ?? 0;

  const { data: pwTestCount, isLoading: pwLoading } = useQuery({
    queryKey: ["pw", "total-tests"],
    queryFn: fetchPwTotalTests,
    staleTime: 1000 * 60 * 60 * 6,
    gcTime: 1000 * 60 * 60 * 24,
    enabled: typeof window !== "undefined",
  });

  // Show core total instantly; append PW count once it resolves.
  const combinedDisplay = isLoading
    ? "…"
    : pwLoading || pwTestCount == null
      ? `${totalTests}+`
      : String(totalTests + pwTestCount);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden border-b-2 border-ink/10 bg-gradient-hero">
        <div className="absolute inset-0 dot-bg opacity-60" />
        <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-12 sm:px-6 sm:pt-20 lg:pb-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
            <div style={{ animation: "fade-up 0.5s both" }}>
              <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink/10 bg-card px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground shadow-soft">
                <GraduationCap className="h-3 w-3 text-primary" />
                AdhyayX <span className="text-muted-foreground normal-case tracking-normal">:</span> <span className="text-primary">Har Adhyay, Ek Nayi Jeet</span>
              </span>
              <h1 className="mt-4 font-display text-[26px] font-bold leading-[1.18] tracking-tight text-foreground sm:text-[36px] lg:text-[44px]">
                Crack <span className="text-primary">JEE, NEET</span>, boards &amp;<br />
                competitive exams with<br />
                exam-grade mocks.
              </h1>
              <p className="mt-3 max-w-xl text-xs text-muted-foreground sm:text-sm">
                Plus <span className="font-bold text-foreground">daily news</span> and
                date-wise <span className="font-bold text-foreground">current affairs</span>
                {" "}— everything in one place.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <Link
                  to="/categories"
                  className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2.5 text-xs font-bold text-background shadow-soft transition-transform hover:scale-[1.03] active:scale-95"
                >
                  Choose your category
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="mt-7 flex max-w-md flex-wrap gap-x-7 gap-y-3 text-left">
                {[
                  { k: combinedDisplay, v: "Active tests" },
                  {
                    k: isLoading ? "…" : String(categories.length || 0),
                    v: categories.length === 1 ? "Category" : "Categories",
                  },
                  { k: "Free", v: "No signup needed" },
                ].map((s) => (
                  <div key={s.v}>
                    <div className="font-display text-2xl font-bold text-foreground tabular-nums">{s.k}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{s.v}</div>
                  </div>
                ))}
              </div>
            </div>


            {/* Brand panel */}
            <div className="relative" style={{ animation: "fade-up 0.6s 0.1s both" }}>
              <div className="absolute -inset-4 rounded-3xl bg-primary/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-3xl border-2 border-ink bg-foreground p-8 text-background shadow-elevated">
                <div className="absolute inset-0 grid-bg opacity-20" />
                <div className="relative flex items-center gap-4">
                  <img src={logoVx} alt="AdhyayX" className="h-16 w-16 rounded-2xl ring-2 ring-background/30" />
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-background/60">
                      The platform
                    </div>
                    <div className="font-display text-2xl font-bold">
                      Adhyay<span className="text-primary-glow">X</span>
                    </div>
                    <div className="text-xs font-semibold text-background/70">Har Adhyay, Ek Nayi Jeet</div>
                  </div>
                </div>
                <div className="relative mt-6 grid grid-cols-2 gap-3">
                  {[
                    { icon: Newspaper, label: "Daily news feed" },
                    { icon: Calendar, label: "Date-wise affairs" },
                    { icon: BarChart3, label: "Instant scoring" },
                    { icon: ShieldCheck, label: "No signup needed" },
                  ].map((f) => (
                    <div key={f.label} className="flex items-center gap-2 rounded-xl border border-background/15 bg-background/5 p-3">
                      <f.icon className="h-4 w-4 text-primary-glow" />
                      <span className="text-xs font-semibold">{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="border-y-2 border-ink/10 bg-surface py-16">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Why AdhyayX
            </div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Built like the actual exam.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Every detail keeps you focused, current, and exam-ready.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-3xl gap-3 grid-cols-2">
            {[
              { icon: Newspaper, title: "Daily news", desc: "Latest stories, refreshed every day." },
              { icon: Calendar, title: "Current affairs", desc: "Date-wise digests, ready for revision." },
              { icon: Brain, title: "Smart navigation", desc: "Palette drawer to jump anywhere instantly." },
              { icon: BarChart3, title: "Instant scoring", desc: "Subject-wise breakdown right after submit." },
              { icon: CheckCircle2, title: "Mark for review", desc: "Flag tricky questions, revisit before submit." },
              { icon: ShieldCheck, title: "Zero signup", desc: "Pick a test and start. No friction." },
            ].map((f, i) => (
              <div
                key={f.title}
                className="rounded-xl border-2 border-ink/10 bg-card p-3 transition-all hover:-translate-y-0.5 hover:border-foreground sm:p-4"
                style={{ animation: `fade-up 0.45s ${i * 40}ms both` }}
              >
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
                  <f.icon className="h-4 w-4" />
                </div>
                <h3 className="mt-2 font-display text-sm font-bold sm:text-base">{f.title}</h3>
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground sm:text-xs">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6">
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[oklch(0.45_0.27_265)] via-[oklch(0.42_0.27_268)] to-[oklch(0.32_0.22_270)] p-7 text-background shadow-elevated sm:p-12">
          <div className="pointer-events-none absolute -left-10 -top-20 h-72 w-72 rounded-full bg-white/35 blur-3xl" />
          <div className="pointer-events-none absolute right-10 bottom-10 h-40 w-40 rounded-full bg-primary-glow/30 blur-3xl" />

          <div className="relative max-w-2xl">
            <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-background/85">
              Get started
            </div>
            <h3 className="mt-3 font-display text-2xl font-bold leading-[1.15] sm:text-4xl">
              Open AdhyayX and start<br className="hidden sm:block" /> learning with confidence.
            </h3>
            <p className="mt-4 max-w-lg text-xs text-background/85 sm:text-sm">
              Free mock tests, daily news and date-wise current affairs — straight from your browser, no setup needed.
            </p>
          </div>

          <div className="relative mt-8 flex items-center justify-between gap-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-background p-1.5 shadow-soft ring-2 ring-background/40">
              <img src={logoVx} alt="AdhyayX" className="h-full w-full rounded-full object-cover" />
            </span>
            <Link
              to="/categories"
              className="inline-flex items-center gap-2 rounded-full bg-background px-5 py-3 text-xs font-bold text-foreground shadow-soft transition-transform hover:scale-[1.04] active:scale-95 sm:text-sm"
            >
              Browse tests <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-5 pb-16 sm:px-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            <HelpCircle className="h-3 w-3" /> FAQ
          </span>
          <h2 className="mt-2 font-display text-xl font-bold tracking-tight sm:text-2xl">
            Questions, answered.
          </h2>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Everything you need to know before you start.
          </p>
        </div>
        <FAQList
          items={[
            { q: "Do I need to sign up to attempt a test?", a: "No. Pick a category, open any test, and start instantly — no account, no friction." },
            { q: "Does the test run in full-screen?", a: "Yes. The moment you tap Start Test, AdhyayX goes full-screen for a distraction-free exam feel." },
            { q: "Can I navigate between questions freely?", a: "Yes. Use the big Previous / Next buttons or open the palette drawer to jump anywhere, grouped by subject." },
            { q: "What happens when time runs out?", a: "The test auto-submits with whatever answers you've marked and takes you straight to a detailed result." },
            { q: "Where do I read current affairs & news?", a: "Visit the Current Affairs page for date-wise digests, or Daily News for the latest stories — each lives on its own page." },
          ]}
        />
      </section>

      <Footer />
    </div>
  );
}

function FAQList({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mt-6 space-y-2.5">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={item.q}
            className={`overflow-hidden rounded-xl border-2 bg-card transition-all ${
              isOpen ? "border-foreground shadow-soft" : "border-ink/10 hover:border-ink/30"
            }`}
            style={{ animation: `fade-up 0.4s ${i * 50}ms both` }}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              aria-expanded={isOpen}
            >
              <span className="font-display text-xs font-bold text-foreground sm:text-sm">
                {item.q}
              </span>
              <span
                className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                  isOpen
                    ? "border-foreground bg-foreground text-background rotate-45"
                    : "border-ink/15 text-foreground"
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
              </span>
            </button>
            <div
              className={`grid transition-all duration-300 ease-out ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-4 pb-4 text-xs leading-relaxed text-muted-foreground">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
