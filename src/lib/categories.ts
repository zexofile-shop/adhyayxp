import type { Test } from "./testApi";
import { Atom, FlaskConical, GraduationCap, Cpu, BookOpen, Calculator, Microscope } from "lucide-react";

export type CategoryMeta = {
  stream: string;
  label: string;
  short: string;
  tagline: string;
  icon: typeof Atom;
  accent: string;
};

const META: Record<string, Omit<CategoryMeta, "stream">> = {
  "Class 9": { label: "Class 9 · Foundation", short: "Class 9", tagline: "Concept-building tests for Class 9.", icon: BookOpen, accent: "from-sky-500 to-blue-600" },
  "Class 10": { label: "Class 10 · Boards", short: "Class 10", tagline: "Board-style chapter and full tests.", icon: BookOpen, accent: "from-amber-500 to-orange-600" },
  "Class 11": { label: "Class 11 · Foundation", short: "Class 11", tagline: "Strong foundation across PCMB.", icon: Calculator, accent: "from-violet-500 to-fuchsia-600" },
  "Class 12": { label: "Class 12 · Boards", short: "Class 12", tagline: "Board-grade full-syllabus tests.", icon: GraduationCap, accent: "from-indigo-500 to-blue-700" },
  "11th JEE": { label: "Class 11 · JEE", short: "JEE 11", tagline: "Foundation mocks for JEE aspirants.", icon: Calculator, accent: "from-violet-500 to-fuchsia-600" },
  "11th NEET": { label: "Class 11 · NEET", short: "NEET 11", tagline: "Build a strong base for NEET.", icon: FlaskConical, accent: "from-pink-500 to-rose-600" },
  "12th JEE": { label: "Class 12 · JEE", short: "JEE", tagline: "Mains + Advanced level PCM mocks.", icon: Atom, accent: "from-blue-500 to-indigo-600" },
  "12th NEET": { label: "Class 12 · NEET", short: "NEET", tagline: "Biology, Chemistry & Physics for medical aspirants.", icon: Microscope, accent: "from-emerald-500 to-teal-600" },
  "Dropper JEE": { label: "Dropper · JEE", short: "Dropper JEE", tagline: "Full-syllabus revision for JEE droppers.", icon: Atom, accent: "from-blue-600 to-indigo-700" },
  "Dropper NEET": { label: "Dropper · NEET", short: "Dropper NEET", tagline: "Full-syllabus revision for NEET droppers.", icon: Microscope, accent: "from-emerald-600 to-teal-700" },
  "GATE ECE": { label: "GATE · Electronics", short: "GATE ECE", tagline: "Subject-wise GATE practice for ECE.", icon: Cpu, accent: "from-slate-700 to-slate-900" },
  "GATE ME": { label: "GATE · Mechanical", short: "GATE ME", tagline: "Subject-wise GATE practice for ME.", icon: Cpu, accent: "from-zinc-700 to-zinc-900" },
};

const FALLBACK: Omit<CategoryMeta, "stream"> = {
  label: "General",
  short: "General",
  tagline: "Curated practice tests.",
  icon: GraduationCap,
  accent: "from-primary to-primary-glow",
};

/**
 * Junior → Senior ordering: Class 9 → 10 → 11 → 12 → JEE → NEET → GATE → others.
 * Returns a small integer; lower = earlier in the list.
 */
export function streamRank(stream: string): number {
  const s = stream.toLowerCase();
  if (s.includes("class 9") || s.startsWith("9")) return 10;
  if (s.includes("class 10") || s.startsWith("10")) return 20;
  if (s.includes("class 11") && !s.includes("jee") && !s.includes("neet")) return 30;
  if (s.includes("11th jee") || s === "11 jee") return 31;
  if (s.includes("11th neet") || s === "11 neet") return 32;
  if (s.includes("class 12") && !s.includes("jee") && !s.includes("neet")) return 40;
  if (s.includes("12th jee") || s === "12 jee") return 41;
  if (s.includes("12th neet") || s === "12 neet") return 42;
  if (s.includes("dropper") && s.includes("jee")) return 50;
  if (s.includes("jee")) return 51;
  if (s.includes("dropper") && s.includes("neet")) return 55;
  if (s.includes("neet")) return 56;
  if (s.includes("gate")) return 70;
  return 99;
}

export function buildCategories(tests: Test[]): (CategoryMeta & { count: number })[] {
  const map = new Map<string, number>();
  tests.forEach((t) => {
    const k = t.stream || "General";
    map.set(k, (map.get(k) ?? 0) + 1);
  });
  return Array.from(map.entries())
    .map(([stream, count]) => ({
      stream,
      count,
      ...(META[stream] ?? { ...FALLBACK, label: stream, short: stream }),
    }))
    .sort((a, b) => {
      const r = streamRank(a.stream) - streamRank(b.stream);
      if (r !== 0) return r;
      return a.stream.localeCompare(b.stream);
    });
}

export function getCategoryMeta(stream: string): CategoryMeta {
  const m = META[stream] ?? { ...FALLBACK, label: stream, short: stream };
  return { stream, ...m };
}

export { GraduationCap };
