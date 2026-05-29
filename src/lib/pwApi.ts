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
  type: string; // "Single" | "Multiple" | "Numerical" | ...
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
    solutions: string[]; // option _id(s) considered correct
    solutionDescription?: { images?: { en?: string } }[];
    topic?: string[];
    images?: { en?: string };
  };
}
export interface PwSolutionsResponse {
  _id: string;
  questions: PwSolutionEntry[];
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/${path}`);
  if (!res.ok) throw new Error(`PW fetch failed: ${path}`);
  const j = (await res.json()) as { success: boolean; data: T };
  return j.data;
}

export const fetchPwBatches = (exam: string, klass: string) =>
  getJson<PwBatch[]>(`batches?exam=${encodeURIComponent(exam)}&class=${encodeURIComponent(klass)}`);

export const fetchPwTests = (batchId: string, testCatId: string) =>
  getJson<PwTestSummary[]>(
    `tests?batchId=${encodeURIComponent(batchId)}&testCatId=${encodeURIComponent(testCatId)}`,
  );

export const fetchPwQuestions = (testId: string) =>
  getJson<PwQuestionsResponse>(`tests/${encodeURIComponent(testId)}/questions`);

export const fetchPwSolutions = (testId: string) =>
  getJson<PwSolutionsResponse>(`tests/${encodeURIComponent(testId)}/solutions`);

export interface PwInstructions {
  _id: string;
  name: string;
  maxDuration: number;
  totalMarks: number;
  totalQuestions: number;
  multiGeneralInstructions?: { en?: string };
}
export const fetchPwInstructions = (testId: string) =>
  getJson<PwInstructions>(`tests/${encodeURIComponent(testId)}/instructions`);

export interface PwLeaderboard {
  _id: string;
  totalScore: number;
  rankScores: [number, number][]; // [rank, score]
}
export const fetchPwLeaderboard = (testId: string) =>
  getJson<PwLeaderboard>(`tests/${encodeURIComponent(testId)}/leaderboard`);

export interface PwFilters {
  exam: string[];
  class: string[];
}

export const fetchPwFilters = () =>
  getJson<PwFilters>("filters");

