import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import {
  fetchPwInstructions,
  fetchPwLeaderboard,
  fetchPwQuestions,
  fetchPwSolutions,
  type PwLeaderboard,
  type PwQuestion,
  type PwSection,
} from "@/lib/pwApi";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  FileText,
  Loader2,
  Star,
  Trophy,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/pw/test/$testId")({
  head: () => ({ meta: [{ title: "PW Test — AdhyayX" }] }),
  component: PwTestPage,
  errorComponent: ({ error }) => (
    <div className="p-10 text-center text-sm text-muted-foreground">
      Couldn't load test: {error.message}
    </div>
  ),
});

type Answers = Record<string, string>;
type Stage = "instructions" | "attempt" | "result";

function PwTestPage() {
  const { testId } = Route.useParams();
  const [stage, setStage] = useState<Stage>("instructions");

  const ins = useQuery({
    queryKey: ["pw", "instructions", testId],
    queryFn: () => fetchPwInstructions(testId),
  });

  const q = useQuery({
    queryKey: ["pw", "questions", testId],
    queryFn: () => fetchPwQuestions(testId),
    enabled: stage !== "instructions",
  });

  const [sectionIdx, setSectionIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  const sol = useQuery({
    queryKey: ["pw", "solutions", testId],
    queryFn: () => fetchPwSolutions(testId),
    enabled: stage === "result",
  });
  const lb = useQuery({
    queryKey: ["pw", "leaderboard", testId],
    queryFn: () => fetchPwLeaderboard(testId),
    enabled: stage === "result",
  });

  // -------- INSTRUCTIONS STAGE --------
  if (stage === "instructions") {
    return (
      <InstructionsView
        loading={ins.isLoading}
        error={ins.isError}
        data={ins.data}
        onProceed={() => setStage("attempt")}
      />
    );
  }

  if (q.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading questions…
        </div>
      </div>
    );
  }
  if (q.isError || !q.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
        <div>
          <h2 className="font-display text-lg font-bold">Couldn't load this test</h2>
          <p className="mt-1 text-sm text-muted-foreground">Try again in a moment.</p>
          <Link
            to="/pw"
            className="mt-4 inline-flex rounded-full bg-foreground px-4 py-2 text-xs font-bold text-background"
          >
            Back to PW
          </Link>
        </div>
      </div>
    );
  }

  const sections = q.data.sections ?? [];
  const section: PwSection | undefined = sections[sectionIdx];
  const question: PwQuestion | undefined = section?.questions[qIdx];

  // -------- RESULT STAGE --------
  if (stage === "result") {
    return (
      <ResultView
        testId={testId}
        sections={sections}
        answers={answers}
        solutionsLoading={sol.isLoading}
        solutions={sol.data?.questions ?? []}
        solutionsError={sol.isError}
        leaderboard={lb.data}
        leaderboardLoading={lb.isLoading}
        testName={ins.data?.name}
      />
    );
  }

  // -------- ATTEMPT STAGE --------
  return (
    <AttemptView
      sections={sections}
      section={section}
      sectionIdx={sectionIdx}
      setSectionIdx={setSectionIdx}
      question={question}
      qIdx={qIdx}
      setQIdx={setQIdx}
      answers={answers}
      setAnswers={setAnswers}
      onSubmit={() => setStage("result")}
      testName={ins.data?.name}
      maxDuration={ins.data?.maxDuration}
    />
  );
}

// ---------------- INSTRUCTIONS ----------------
function InstructionsView({
  loading,
  error,
  data,
  onProceed,
}: {
  loading: boolean;
  error: boolean;
  data?: {
    name: string;
    maxDuration: number;
    totalMarks: number;
    totalQuestions: number;
    multiGeneralInstructions?: { en?: string };
  };
  onProceed: () => void;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="border-b-2 border-ink/10 bg-surface">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
          <Link
            to="/pw"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" /> Back to tests
          </Link>
          <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            Physics Wallah
          </div>
          <h1 className="mt-1 font-display text-xl font-bold sm:text-3xl">
            {data?.name ?? "Loading…"}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Read the instructions carefully before proceeding.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Fetching instructions…
          </div>
        ) : error ? (
          <div className="rounded-2xl border-2 border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
            Couldn't load instructions. You can still proceed to the test.
            <div className="mt-3">
              <button
                onClick={onProceed}
                className="rounded-full bg-foreground px-4 py-2 text-xs font-bold uppercase tracking-wider text-background"
              >
                Proceed anyway
              </button>
            </div>
          </div>
        ) : data ? (
          <>
            <div className="rounded-2xl border-2 border-ink/10 bg-card p-4 sm:p-6">
              <div className="text-sm font-bold text-foreground">Test Details</div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat icon={<FileText className="h-4 w-4" />} label="Questions" value={String(data.totalQuestions)} />
                <Stat icon={<Star className="h-4 w-4" />} label="Total Marks" value={String(data.totalMarks)} />
                <Stat icon={<Clock className="h-4 w-4" />} label="Duration" value={`${data.maxDuration} min`} />
                <Stat icon={<BookOpen className="h-4 w-4" />} label="Type" value="Online" />
              </div>
            </div>

            <div className="mt-4 rounded-2xl border-2 border-ink/10 bg-card p-4 sm:p-6">
              <div className="text-sm font-bold text-foreground">Test Instructions</div>
              <div
                className="prose prose-sm mt-3 max-w-none text-[13px] leading-relaxed text-foreground [&_h4]:mt-3 [&_h4]:text-sm [&_h4]:font-bold [&_p]:my-2 [&_strong]:font-bold"
                dangerouslySetInnerHTML={{
                  __html:
                    data.multiGeneralInstructions?.en ??
                    "<p>No additional instructions provided.</p>",
                }}
              />
            </div>

            <div className="mt-4 rounded-2xl border-2 border-ink/10 bg-card p-4 sm:p-6">
              <div className="text-sm font-bold text-foreground">Ready to start?</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Make sure you have read all the instructions carefully.
              </p>
              <button
                onClick={onProceed}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-bold uppercase tracking-wider text-background hover:bg-foreground/90 sm:w-auto"
              >
                Proceed to Test <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : null}
      </section>
      <Footer />
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border-2 border-ink/10 bg-background p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <div className="mt-1 font-display text-lg font-bold text-foreground">{value}</div>
    </div>
  );
}

// ---------------- ATTEMPT ----------------
function AttemptView({
  sections,
  section,
  sectionIdx,
  setSectionIdx,
  question,
  qIdx,
  setQIdx,
  answers,
  setAnswers,
  onSubmit,
  testName,
  maxDuration,
}: {
  sections: PwSection[];
  section?: PwSection;
  sectionIdx: number;
  setSectionIdx: (n: number) => void;
  question?: PwQuestion;
  qIdx: number;
  setQIdx: (updater: (i: number) => number) => void;
  answers: Answers;
  setAnswers: (updater: (a: Answers) => Answers) => void;
  onSubmit: () => void;
  testName?: string;
  maxDuration?: number;
}) {
  const totals = useMemo(() => {
    const total = sections.reduce((n, s) => n + s.questions.length, 0);
    const attempted = Object.keys(answers).length;
    return { total, attempted };
  }, [sections, answers]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="border-b-2 border-ink/10 bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-7">
          <Link
            to="/pw"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" /> Back to PW
          </Link>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                Physics Wallah Test
              </div>
              <h1 className="mt-1 font-display text-lg font-bold sm:text-2xl">
                {testName ?? "Attempt the paper"}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                {totals.attempted} / {totals.total} answered
                {maxDuration ? ` · ${maxDuration} min` : ""}
              </p>
            </div>
            <button
              onClick={onSubmit}
              className="rounded-full bg-foreground px-4 py-2 text-xs font-bold uppercase tracking-wider text-background hover:bg-foreground/90"
            >
              Submit test
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {sections.map((s, i) => (
              <button
                key={s._id}
                onClick={() => {
                  setSectionIdx(i);
                  setQIdx(() => 0);
                }}
                className={`rounded-full border-2 px-3 py-1.5 text-[11px] font-bold transition-colors ${
                  i === sectionIdx
                    ? "border-foreground bg-foreground text-background"
                    : "border-ink/10 bg-card text-foreground hover:border-foreground"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-5 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[1fr_280px]">
        <div className="rounded-2xl border-2 border-ink/10 bg-card p-4 sm:p-6">
          {question ? (
            <>
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <span>
                  Q{question.questionNumber} · {question.type}
                </span>
                <span className="text-primary">
                  +{question.positiveMarks} / -{question.negativeMarks}
                </span>
              </div>
              {question.imageIds?.en && (
                <img
                  src={question.imageIds.en}
                  alt={`Question ${question.questionNumber}`}
                  className="mt-3 w-full rounded-lg border border-ink/10 bg-white"
                />
              )}

              {question.type === "Numerical" ? (
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Enter your numerical answer"
                  value={answers[question._id] ?? ""}
                  onChange={(e) =>
                    setAnswers((a) => ({ ...a, [question._id]: e.target.value }))
                  }
                  className="mt-4 w-full rounded-lg border-2 border-ink/10 bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
                />
              ) : (
                <div className="mt-4 grid gap-2">
                  {question.options.map((opt, i) => {
                    const selected = answers[question._id] === opt._id;
                    return (
                      <button
                        key={opt._id}
                        onClick={() =>
                          setAnswers((a) => ({ ...a, [question._id]: opt._id }))
                        }
                        className={`flex items-center gap-3 rounded-lg border-2 p-3 text-left text-sm transition-colors ${
                          selected
                            ? "border-foreground bg-foreground/5"
                            : "border-ink/10 hover:border-foreground/50"
                        }`}
                      >
                        <span
                          className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                            selected
                              ? "border-foreground bg-foreground text-background"
                              : "border-ink/20 text-foreground"
                          }`}
                        >
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-foreground">{opt.texts?.en ?? ""}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 flex items-center justify-between border-t-2 border-dashed border-ink/10 pt-4">
                <button
                  disabled={qIdx === 0}
                  onClick={() => setQIdx((i) => Math.max(0, i - 1))}
                  className="inline-flex items-center gap-1 rounded-full border-2 border-ink/10 px-3.5 py-1.5 text-xs font-bold disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </button>
                <button
                  onClick={() =>
                    setAnswers((a) => {
                      const n = { ...a };
                      delete n[question._id];
                      return n;
                    })
                  }
                  className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
                <button
                  disabled={qIdx >= (section?.questions.length ?? 1) - 1}
                  onClick={() =>
                    setQIdx((i) => Math.min((section?.questions.length ?? 1) - 1, i + 1))
                  }
                  className="inline-flex items-center gap-1 rounded-full bg-foreground px-3.5 py-1.5 text-xs font-bold text-background disabled:opacity-40"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">No questions in this section.</div>
          )}
        </div>

        <div className="rounded-2xl border-2 border-ink/10 bg-card p-4">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {section?.name} · Palette
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {(section?.questions ?? []).map((qq, i) => {
              const answered = !!answers[qq._id];
              const active = i === qIdx;
              return (
                <button
                  key={qq._id}
                  onClick={() => setQIdx(() => i)}
                  className={`h-8 w-full rounded text-[11px] font-bold transition-colors ${
                    active
                      ? "bg-foreground text-background"
                      : answered
                        ? "bg-primary/15 text-primary"
                        : "border-2 border-ink/10 text-foreground hover:border-foreground/50"
                  }`}
                >
                  {qq.questionNumber}
                </button>
              );
            })}
          </div>
          <button
            onClick={onSubmit}
            className="mt-4 w-full rounded-full bg-foreground py-2.5 text-xs font-bold uppercase tracking-wider text-background hover:bg-foreground/90"
          >
            Submit test
          </button>
        </div>
      </section>
      <Footer />
    </div>
  );
}

// ---------------- RESULT ----------------
function ResultView({
  testId,
  sections,
  answers,
  solutionsLoading,
  solutions,
  solutionsError,
  leaderboard,
  leaderboardLoading,
  testName,
}: {
  testId: string;
  sections: PwSection[];
  answers: Answers;
  solutionsLoading: boolean;
  solutions: {
    question: PwQuestion & {
      solutions: string[];
      solutionDescription?: { images?: { en?: string } }[];
      topic?: string[];
      images?: { en?: string };
    };
  }[];
  solutionsError: boolean;
  leaderboard?: PwLeaderboard;
  leaderboardLoading: boolean;
  testName?: string;
}) {
  const [showSolutions, setShowSolutions] = useState(false);

  if (solutionsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Scoring your test…
        </div>
      </div>
    );
  }
  if (solutionsError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
        <div>
          <h2 className="font-display text-lg font-bold">Couldn't fetch solutions</h2>
          <Link
            to="/pw/test/$testId"
            params={{ testId }}
            reloadDocument
            className="mt-4 inline-flex rounded-full bg-foreground px-4 py-2 text-xs font-bold text-background"
          >
            Retry
          </Link>
        </div>
      </div>
    );
  }

  const solMap = new Map(solutions.map((s) => [s.question._id, s.question]));
  let correct = 0;
  let wrong = 0;
  let score = 0;
  const allQuestions: PwQuestion[] = [];
  sections.forEach((s) => s.questions.forEach((qq) => allQuestions.push(qq)));

  allQuestions.forEach((qq) => {
    const ans = answers[qq._id];
    const sol = solMap.get(qq._id);
    if (!ans || !sol) return;
    const isCorrect = sol.solutions?.includes(ans);
    if (isCorrect) {
      correct++;
      score += qq.positiveMarks;
    } else {
      wrong++;
      score -= qq.negativeMarks;
    }
  });
  const totalMarks = allQuestions.reduce((n, x) => n + x.positiveMarks, 0);
  const unattempted = allQuestions.length - correct - wrong;
  const percentage = totalMarks > 0 ? ((score / totalMarks) * 100).toFixed(2) : "0.00";

  // Compute rank from leaderboard rankScores: [rank, score] sorted by rank asc, score desc.
  let userRank: number | null = null;
  let totalStudents: number | null = null;
  if (leaderboard?.rankScores?.length) {
    const rs = leaderboard.rankScores;
    totalStudents = rs[rs.length - 1][0];
    // find first rank where rankScore <= user score
    const found = rs.find(([, sc]) => sc <= score);
    userRank = found ? found[0] : totalStudents + 1;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="border-b-2 border-ink/10 bg-surface">
        <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-10">
          <Link
            to="/pw"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" /> Back to PW
          </Link>
          <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            Test Completed
          </div>
          <h1 className="mt-1 font-display text-xl font-bold sm:text-2xl">
            {testName ?? "Your result"}
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Summary grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryStat label="Correct" value={correct} tone="emerald" />
          <SummaryStat label="Wrong" value={wrong} tone="red" />
          <SummaryStat label="Unattempted" value={unattempted} tone="muted" />
          <SummaryStat label="Total" value={allQuestions.length} tone="primary" />
        </div>

        <div className="mt-4 rounded-2xl border-2 border-ink/10 bg-card p-5 text-center">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Marks Obtained
          </div>
          <div className="mt-1 font-display text-3xl font-bold text-primary">
            {score}
            <span className="text-muted-foreground"> / {totalMarks}</span>
          </div>
          <div className="mt-2 flex justify-center gap-6 text-xs">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Percentage
              </div>
              <div className="font-bold text-emerald-600">{percentage}%</div>
            </div>
          </div>
        </div>

        {/* Rank card */}
        {leaderboardLoading ? (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border-2 border-dashed border-ink/10 p-5 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading leaderboard…
          </div>
        ) : userRank !== null && totalStudents !== null ? (
          <div className="mt-4 rounded-2xl border-2 border-amber-400/40 bg-amber-50 p-5 text-center dark:bg-amber-500/10">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-white">
              <Trophy className="h-6 w-6" />
            </div>
            <div className="mt-2 text-[11px] font-bold uppercase tracking-wider text-amber-700">
              Your Rank
            </div>
            <div className="font-display text-3xl font-bold text-amber-600">#{userRank}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              out of {totalStudents.toLocaleString()} students
            </div>
          </div>
        ) : null}

        {/* CTAs */}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => setShowSolutions((v) => !v)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90"
          >
            {showSolutions ? (
              <>
                Hide Detailed Solutions <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                View Detailed Solutions <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
          <Link
            to="/pw"
            className="inline-flex flex-1 items-center justify-center rounded-xl border-2 border-ink/10 bg-card px-4 py-3 text-sm font-bold text-foreground hover:border-foreground"
          >
            Back to Tests
          </Link>
        </div>

        {/* Leaderboard table */}
        {leaderboard?.rankScores?.length ? (
          <div className="mt-6 overflow-hidden rounded-2xl border-2 border-ink/10 bg-card">
            <div className="flex items-center justify-between bg-amber-500 px-4 py-3 text-white">
              <div className="flex items-center gap-2 text-sm font-bold">
                <Star className="h-4 w-4" /> Test Leaderboard
              </div>
              {userRank !== null && (
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                  Your Rank: #{userRank}
                </span>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left">Rank</th>
                    <th className="px-4 py-2 text-right">Marks</th>
                    <th className="px-4 py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.rankScores.slice(0, 50).map(([rank, sc]) => {
                    const pct = leaderboard.totalScore > 0 ? (sc / leaderboard.totalScore) * 100 : 0;
                    const status =
                      pct >= 80 ? "Excellent" : pct >= 60 ? "Very Good" : pct >= 40 ? "Good" : "Keep going";
                    const tone =
                      pct >= 80
                        ? "bg-emerald-100 text-emerald-700"
                        : pct >= 60
                          ? "bg-blue-100 text-blue-700"
                          : pct >= 40
                            ? "bg-amber-100 text-amber-700"
                            : "bg-muted text-muted-foreground";
                    return (
                      <tr key={rank} className="border-t border-ink/5">
                        <td className="px-4 py-2 font-bold text-foreground">#{rank}</td>
                        <td className="px-4 py-2 text-right font-semibold">
                          {sc} / {leaderboard.totalScore}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${tone}`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 text-center text-[11px] text-muted-foreground">
              Showing top 50 of {totalStudents?.toLocaleString() ?? "—"} entries
            </div>
          </div>
        ) : null}

        {/* Detailed solutions */}
        {showSolutions && (
          <div className="mt-6 space-y-8">
            {sections.map((s) => (
              <div key={s._id}>
                <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                  {s.name}
                </div>
                <div className="space-y-3">
                  {s.questions.map((qq) => {
                    const sol = solMap.get(qq._id);
                    const ans = answers[qq._id];
                    const correctIds = sol?.solutions ?? [];
                    const isCorrect = !!ans && correctIds.includes(ans);
                    const isWrong = !!ans && !isCorrect;
                    return (
                      <div
                        key={qq._id}
                        className="rounded-2xl border-2 border-ink/10 bg-card p-4 sm:p-5"
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                          <span className="text-muted-foreground">Q{qq.questionNumber}</span>
                          {ans ? (
                            isCorrect ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Correct
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-700">
                                <XCircle className="h-3.5 w-3.5" /> Wrong
                              </span>
                            )
                          ) : (
                            <span className="text-muted-foreground">Skipped</span>
                          )}
                        </div>
                        {qq.imageIds?.en && (
                          <img
                            src={qq.imageIds.en}
                            alt=""
                            className="mt-3 w-full rounded-lg border border-ink/10 bg-white"
                          />
                        )}
                        <div className="mt-3 grid gap-1.5">
                          {qq.options.map((opt, i) => {
                            const isAns = ans === opt._id;
                            const isCorrectOpt = correctIds.includes(opt._id);
                            return (
                              <div
                                key={opt._id}
                                className={`flex items-center gap-3 rounded-lg border-2 p-2.5 text-sm ${
                                  isCorrectOpt
                                    ? "border-emerald-500/60 bg-emerald-500/10"
                                    : isAns && isWrong
                                      ? "border-red-500/60 bg-red-500/10"
                                      : "border-ink/10"
                                }`}
                              >
                                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-ink/20 text-[11px] font-bold">
                                  {String.fromCharCode(65 + i)}
                                </span>
                                <span>{opt.texts?.en ?? ""}</span>
                              </div>
                            );
                          })}
                        </div>
                        {sol?.solutionDescription?.[0]?.images?.en && (
                          <div className="mt-3 rounded-lg border border-ink/10 bg-surface p-2">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Solution
                            </div>
                            <img
                              src={sol.solutionDescription[0].images.en}
                              alt=""
                              className="mt-2 w-full rounded bg-white"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "red" | "muted" | "primary";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-600"
      : tone === "red"
        ? "text-red-600"
        : tone === "primary"
          ? "text-primary"
          : "text-foreground";
  return (
    <div className="rounded-2xl border-2 border-ink/10 bg-card p-4 text-center">
      <div className={`font-display text-2xl font-bold ${toneClass}`}>{value}</div>
      <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
