import type { Question, QuestionTier, SectionId } from "./questions";
import { SECTIONS } from "./questions";

export type ScoreTier = "NOT_READY" | "GETTING_THERE" | "ALMOST" | "SHIP_IT";

export interface QuestionEvaluation {
  score: number;
  tier: QuestionTier;
  feedback: string;
  action?: string;
}

export type SectionEvaluations = Record<string, QuestionEvaluation>;

export function tierForScore(score: number): QuestionTier {
  if (score >= 8) return "GREEN";
  if (score >= 5) return "AMBER";
  return "RED";
}

export function scoreTier(overall: number): ScoreTier {
  if (overall >= 82) return "SHIP_IT";
  if (overall >= 62) return "ALMOST";
  if (overall >= 38) return "GETTING_THERE";
  return "NOT_READY";
}

export function computeOverallScore(
  evaluations: Record<string, QuestionEvaluation>,
  questions: Question[],
  sections: typeof SECTIONS,
): { overall: number; sectionScores: Record<SectionId, number>; tier: ScoreTier } {
  const sectionScores = {} as Record<SectionId, number>;

  for (const [sectionId, section] of Object.entries(sections)) {
    const typedSectionId = sectionId as SectionId;
    const sectionQuestions = questions.filter((question) => question.sectionId === typedSectionId);
    const totalWeight = sectionQuestions.reduce((sum, question) => sum + question.weight, 0);
    const weightedSum = sectionQuestions.reduce((sum, question) => {
      const evaluation = evaluations[question.id];
      return sum + (evaluation?.score ?? 0) * question.weight;
    }, 0);

    sectionScores[typedSectionId] = totalWeight === 0 ? 0 : (weightedSum / totalWeight) * 10;
    void section;
  }

  const overall = Math.round(
    Object.entries(sections).reduce((sum, [sectionId, section]) => {
      return sum + sectionScores[sectionId as SectionId] * section.weight;
    }, 0),
  );

  return { overall, sectionScores, tier: scoreTier(overall) };
}

export const TIER_CONFIG: Record<ScoreTier, { label: string; color: string; message: string }> = {
  NOT_READY: {
    label: "Not Ready",
    color: "red",
    message: "Major gaps in your thinking. Do not ship yet. Address the RED sections first.",
  },
  GETTING_THERE: {
    label: "Getting There",
    color: "orange",
    message: "The foundation is there but real holes remain. Work through the RED feedback before shipping.",
  },
  ALMOST: {
    label: "Almost Ready",
    color: "yellow",
    message: "Strong product thinking with a few gaps. Fix the RED items - you are close.",
  },
  SHIP_IT: {
    label: "Ship It",
    color: "green",
    message: "Exceptional product thinking. You have done the work. Ship it - and keep watching your Novus data.",
  },
};
