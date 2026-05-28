import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import {
  fetchPwQuestions,
  fetchPwSolutions,
  type PwQuestion,
  type PwSection,
} from "@/lib/pwApi";
import { ChevronLeft, ChevronRight, Loader2, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/pw/test/$testId")({
  head: () => ({ meta: [{ title: "PW Test — AdhyayX" }] }),
  component: PwTestPage,
  errorComponent: ({ error }) => (
    <div className="p-10 text-center text-sm text-muted-foreground">
      Couldn't load test: {error.message}
    </div>
  ),
});

type Answers = Record<string, string>; // questionId -> optionId (or numerical value)

function PwTestPage() {
  const { testId } = Route.useParams();
  const q = useQuery({
    queryKey: ["pw", "questions", testId],
    queryFn: () => fetchPwQuestions(testId),
  });

  const [sectionIdx, setSectionIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitted, setSubmitted] = useState(false);

  const sol = useQuery({
    queryKey: ["pw", "solutions", testId],
    queryFn: () => fetchPwSolutions(testId),
    enabled: submitted,
  });

  if (q.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading test…
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

  const totals = useMemo(() => {
    const total = sections.reduce((n, s) => n + s.questions.length, 0);
    const attempted = Object.keys(answers).length;
    return { total, attempted };
  }, [sections, answers]);

  // ------- SUBMITTED VIEW -------
  if (submitted) {
    return (
      <ResultView
        testId={testId}
        sections={sections}
        answers={answers}
        solutionsLoading={sol.isLoading}
        solutions={sol.data?.questions ?? []}
        solutionsError={sol.isError}
      />
    );
  }

  // ------- ATTEMPT VIEW -------
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
                Attempt the paper
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                {totals.attempted} / {totals.total} answered
              </p>
            </div>
            <button
              onClick={() => setSubmitted(true)}
              className="rounded-full bg-foreground px-4 py-2 text-xs font-bold uppercase tracking-wider text-background hover:bg-foreground/90"
            >
              Submit test
            </button>
          </div>

          {/* Section tabs */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {sections.map((s, i) => (
              <button
                key={s._id}
                onClick={() => {
                  setSectionIdx(i);
                  setQIdx(0);
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
        {/* Question */}
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

        {/* Palette */}
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
                  onClick={() => setQIdx(i)}
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
            onClick={() => setSubmitted(true)}
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

// ------------- RESULT VIEW -------------
function ResultView({
  testId,
  sections,
  answers,
  solutionsLoading,
  solutions,
  solutionsError,
}: {
  testId: string;
  sections: PwSection[];
  answers: Answers;
  solutionsLoading: boolean;
  solutions: { question: PwQuestion & { solutions: string[]; solutionDescription?: { images?: { en?: string } }[]; topic?: string[]; images?: { en?: string } } }[];
  solutionsError: boolean;
}) {
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

  // Score
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
            Result
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold sm:text-4xl">
            {score} <span className="text-muted-foreground">/ {totalMarks}</span>
          </h1>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wider">
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-700">
              Correct {correct}
            </span>
            <span className="rounded-full bg-red-500/15 px-3 py-1 text-red-700">
              Wrong {wrong}
            </span>
            <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">
              Unattempted {allQuestions.length - correct - wrong}
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="space-y-8">
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
        <div className="mt-8 flex justify-center">
          <Link
            to="/pw"
            className="rounded-full bg-foreground px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-background"
          >
            More PW tests
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}
