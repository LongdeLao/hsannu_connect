import type { LucideIcon } from "lucide-react";
import { BookOpen, Atom, Calculator, TestTube, Palette, Briefcase, LineChart, Languages } from "lucide-react";

/**
 * Return a Lucide icon component for a given subject name.
 */
export function getSubjectIconForName(subjectName: string): LucideIcon {
  const name = (subjectName || "").toLowerCase();

  if (name.includes("physics")) return Atom;
  if (name.includes("chemistry")) return TestTube;
  if (name.includes("economics") || name.includes("econ")) return LineChart;
  if (name.includes("business")) return Briefcase;
  if (name.includes("chinese") || name.includes("mandarin")) return Languages;
  if (name.includes("english") || name.includes("literature")) return BookOpen;
  if (name.includes("math")) return Calculator;
  if (name.includes("art")) return Palette;

  // Fallback
  return BookOpen;
} 