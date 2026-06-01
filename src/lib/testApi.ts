const BASE = "https://gaqyuylvawgoxuaevhsi.supabase.co/rest/v1";
const APIKEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhcXl1eWx2YXdnb3h1YWV2aHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MDExNTQsImV4cCI6MjA2Nzk3NzE1NH0.tRJXi5vTSopCza_61sYu2ccOrk8LR7UvJ07JPP07OEI";

const headers = {
  apikey: APIKEY,
  Authorization: `Bearer ${APIKEY}`,
  "accept-profile": "public",
  accept: "*/*",
};

export interface Test {
  id: string;
  name: string;
  description: string | null;
  stream: string | null;
  duration_minutes: number;
  total_questions: number;
  category: string | null;
  exam_type: string | null;
  created_at: string;
}

export interface Question {
  id: string;
  question_text: string | null;
  image: string | null;
  // Server returns either a JSON-encoded string or an actual array depending on column shape
  options: string | string[] | null;
  subject: string | null;
  marks: number;
  negative_marks: number;
  type: string;
  /** Correct answer as a letter ("A","B","C","D"...) or sometimes a number/text. */
  correct: string | null;
}

export async function fetchTests(): Promise<Test[]> {
  const res = await fetch(
    `${BASE}/tests?select=*&status=eq.active&order=stream.asc,created_at.desc`,
    { headers },
  );
  if (!res.ok) throw new Error("Failed to load tests");
  const data: Test[] = await res.json();
  // Hide any internal/in-progress tests that have "testing" in their name
  // or description so they never appear in any listing.
  return data.filter(
    (t) =>
      !/testing/i.test(t.name ?? "") &&
      !/testing/i.test(t.description ?? ""),
  );
}

export async function fetchQuestions(testId: string): Promise<Question[]> {
  const res = await fetch(
    `${BASE}/questions?select=id,question_text,image,options,subject,marks,negative_marks,type,correct&test_id=eq.${testId}`,
    { headers },
  );
  if (!res.ok) throw new Error("Failed to load questions");
  return res.json();
}

/**
 * Canonicalise a subject string AND re-map subjects that don't belong in
 * the given stream. NEET = Physics/Chemistry/Biology (Botany+Zoology),
 * never Maths. JEE = Physics/Chemistry/Mathematics, never Biology.
 * If the DB has a mis-tagged question (e.g. "Maths" inside a NEET test),
 * we relabel it so the palette and result read correctly.
 */
export function normalizeSubject(
  subject: string | null | undefined,
  stream: string | null | undefined,
): string {
  const raw = String(subject ?? "").trim();
  const s = raw.toLowerCase();
  const st = String(stream ?? "").toLowerCase();

  let canonical = raw || "General";
  if (s.includes("phys")) canonical = "Physics";
  else if (s.includes("chem")) canonical = "Chemistry";
  else if (s.includes("bot")) canonical = "Botany";
  else if (s.includes("zoo")) canonical = "Zoology";
  else if (s.includes("bio")) canonical = "Biology";
  else if (s.includes("math")) canonical = "Mathematics";
  else if (s.includes("eng")) canonical = "English";

  const isNeet = st.includes("neet");
  const isJee = st.includes("jee");
  if (isNeet && canonical === "Mathematics") return "Biology";
  if (isJee && (canonical === "Biology" || canonical === "Botany" || canonical === "Zoology"))
    return "Mathematics";

  return canonical;
}

/**
 * Resolve the index of the correct option given the raw "correct" field
 * (which can be "A"/"B"/... a number like "1", or even the option text).
 * Returns -1 when no match.
 */
export function correctIndex(raw: string | null | undefined, opts: string[]): number {
  if (!raw) return -1;
  const v = String(raw).trim();
  if (!v) return -1;
  if (/^[A-Za-z]$/.test(v)) {
    const idx = v.toUpperCase().charCodeAt(0) - 65;
    return idx >= 0 && idx < opts.length ? idx : -1;
  }
  if (/^\d{1,2}$/.test(v)) {
    const n = parseInt(v, 10);
    // 1-indexed (1=A) is the common convention
    if (n >= 1 && n <= opts.length) return n - 1;
    if (n >= 0 && n < opts.length) return n;
    return -1;
  }
  const match = opts.findIndex((o) => o.trim().toLowerCase() === v.toLowerCase());
  return match;
}

/**
 * Normalises options into an array of strings.
 * Accepts a JSON-encoded string, an actual array, or null.
 * If nothing usable is present, falls back to ["A","B","C","D"]
 * (useful when the options live inside the question image).
 */
export function parseOptions(raw: string | string[] | null | undefined): string[] {
  let arr: unknown = raw;
  if (typeof raw === "string") {
    try {
      arr = JSON.parse(raw);
    } catch {
      arr = [];
    }
  }
  const list = Array.isArray(arr) ? arr.map((v) => String(v ?? "").trim()) : [];
  const cleaned = list.filter((s) => s.length > 0);
  if (cleaned.length === 0) return ["A", "B", "C", "D"];
  return cleaned;
}

/**
 * Detect the option labelling style.
 * - "letter": values like ["A","B","C","D"] or ["a","b"...]
 * - "number": values like ["1","2","3","4"]
 * - "text":   normal option text (use auto A. B. C. prefixes)
 */
export function detectOptionStyle(opts: string[]): "letter" | "number" | "text" {
  if (opts.length === 0) return "text";
  const isAllLetters = opts.every((o) => /^[A-Za-z]$/.test(o));
  if (isAllLetters) return "letter";
  const isAllNumbers = opts.every((o) => /^\d{1,2}$/.test(o));
  if (isAllNumbers) return "number";
  return "text";
}
