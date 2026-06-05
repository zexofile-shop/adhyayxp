const BASE = "/api/public/pw";

export interface PwBatch {
  _id: string;
  testCatId: string;
  name: string;
  previewImage?: string;
}

export interface PwTestSummary {
  _id: string;
  name: string;
  totalQuestions: number;
  totalMarks: number;
  startTime?: string;
  maxDuration: number;
}

export interface PwOption {
  _id: string;
  texts: { en?: string };
}

export interface PwQuestion {
  _id: string;
  type: string;
  questionNumber: number;
  positiveMarks: number;
  negativeMarks: number;
  imageIds?: { en?: string };
  options: PwOption[];
  numericDecimalLimit?: number | null;
}

export interface PwSection {
  _id: string;
  name: string;
  displayOrder: number;
  questions: PwQuestion[];
}

export interface PwQuestionsResponse {
  _id: string;
  sections: PwSection[];
}

export interface PwSolutionEntry {
  question: PwQuestion & {
    solutions: string[];
    solutionDescription?: { images?: { en?: string } }[];
    topic?: string[];
    images?: { en?: string };
  };
}

export interface PwSolutionsResponse {
  _id: string;
  questions: PwSolutionEntry[];
}

export interface PwInstructions {
  _id: string;
  name: string;
  maxDuration: number;
  totalMarks: number;
  totalQuestions: number;
  startTime?: string;
  multiGeneralInstructions?: { en?: string };
  syllabusData?: { en?: string };
  syllabus?: { en?: string };
  generalInstructions?: { en?: string };
  instructions?: { en?: string };
  platformInstructions?: { en?: string };
  testInstructions?: { en?: string };
  [key: string]: unknown;
}

export interface PwLeaderboard {
  _id: string;
  totalScore: number;
  rankScores: [number, number][];
}

export interface PwFilters {
  exam: string[];
  class: string[];
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/${path}`);
  if (!res.ok) throw new Error(`PW fetch failed: ${path}`);
  const j = (await res.json()) as { success: boolean; data: T };
  return j.data;
}

// Live values from /api/public/pw/filters
export const PW_EXAMS = [
  "IIT-JEE",
  "NEET",
  "BOARD_EXAM",
  "AE/JE",
  "Banking",
  "Bihar Exams",
  "BPSC",
  "CA",
  "COMMERCE",
  "CSIR NET",
  "CUET UG",
  "FOUNDATION",
  "GATE",
  "IIT JAM",
  "LAW",
  "MBA",
  "NDA",
  "NSAT",
  "OLYMPIAD",
  "PRE_FOUNDATION",
  "Railway",
  "SCHOOL_PREPARATION",
  "SSC",
  "UGC NET",
  "UP Exams",
  "UPPSC",
  "UPSC",
] as const;

export const PW_CLASSES = [
  "12+",
  "12",
  "11",
  "10",
  "9",
  "8",
  "7",
  "6",
  "Graduation",
  "Under Graduation",
] as const;

let filtersCache: Promise<PwFilters> | null = null;
export const fetchPwFilters = (): Promise<PwFilters> => {
  if (!filtersCache) {
    filtersCache = getJson<PwFilters>("filters").catch((e) => {
      filtersCache = null;
      throw e;
    });
  }
  return filtersCache;
};

export const fetchPwBatches = (exam: string, klass: string) =>
  getJson<PwBatch[]>(
    `batches?exam=${encodeURIComponent(exam)}&class=${encodeURIComponent(klass)}`
  );

export const fetchPwTests = (batchId: string, testCatId: string) =>
  getJson<PwTestSummary[]>(
    `tests?batchId=${encodeURIComponent(batchId)}&testCatId=${encodeURIComponent(testCatId)}`
  );

export const fetchPwQuestions = (testId: string) =>
  getJson<PwQuestionsResponse>(`tests/${encodeURIComponent(testId)}/questions`);

export const fetchPwSolutions = (testId: string) =>
  getJson<PwSolutionsResponse>(`tests/${encodeURIComponent(testId)}/solutions`);

export const fetchPwInstructions = (testId: string) =>
  getJson<PwInstructions>(`tests/${encodeURIComponent(testId)}/instructions`);

export const fetchPwLeaderboard = (testId: string) =>
  getJson<PwLeaderboard>(`tests/${encodeURIComponent(testId)}/leaderboard`);

async function fetchAllBatches(): Promise<PwBatch[]> {
  const f = await fetchPwFilters().catch(() => ({
    exam: [...PW_EXAMS],
    class: [...PW_CLASSES],
  }));
  const batchResults = await Promise.allSettled(
    f.exam.flatMap((exam) =>
      f.class.map((klass) => fetchPwBatches(exam, klass))
    )
  );
  const all = batchResults
    .filter(
      (r): r is PromiseFulfilledResult<PwBatch[]> => r.status === "fulfilled"
    )
    .flatMap((r) => r.value);
  return Array.from(new Map(all.map((b) => [b._id, b])).values());
}

export const fetchPwTotalBatches = async (): Promise<number> => {
  const all = await fetchAllBatches();
  return all.length;
};

export const fetchPwTotalTests = async (): Promise<number> => {
  const unique = await fetchAllBatches();
  const testResults = await Promise.allSettled(
    unique.map((b) => fetchPwTests(b._id, b.testCatId))
  );
  return testResults
    .filter(
      (r): r is PromiseFulfilledResult<PwTestSummary[]> =>
        r.status === "fulfilled"
    )
    .reduce((sum, r) => sum + r.value.length, 0);
};
