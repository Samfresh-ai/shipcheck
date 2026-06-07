import type { ProjectContext, SectionId } from "./questions";
import type { QuestionEvaluation, ScoreTier } from "./scoring";

export type Answers = Record<string, string>;
export type SectionScores = Record<SectionId, number>;
export type AiFeedback = Record<string, QuestionEvaluation>;

export interface ShipReport {
  id: string;
  sessionId?: string;
  createdAt?: string;
  projectName: string;
  projectUrl?: string;
  projectContext: ProjectContext;
  overallScore: number;
  scoreTier: ScoreTier;
  answers: Answers;
  aiFeedback: AiFeedback;
  sectionScores: SectionScores;
  overallInsight: string;
  isPublic: boolean;
}

export interface ReportInsert {
  sessionId: string;
  projectName: string;
  projectUrl?: string;
  projectContext: ProjectContext;
  answers: Answers;
  aiFeedback: AiFeedback;
  sectionScores: SectionScores;
  overallScore: number;
  scoreTier: ScoreTier;
  overallInsight: string;
  isPublic?: boolean;
}

export interface DatabaseReportRow {
  id: string;
  session_id?: string;
  created_at?: string;
  project_name: string;
  project_url?: string | null;
  project_context: ProjectContext;
  overall_score: number;
  score_tier: ScoreTier;
  answers: Answers;
  ai_feedback: AiFeedback;
  section_scores: SectionScores;
  overall_insight: string;
  is_public: boolean;
}

export function rowToReport(row: DatabaseReportRow): ShipReport {
  return {
    id: row.id,
    sessionId: row.session_id,
    createdAt: row.created_at,
    projectName: row.project_name,
    projectUrl: row.project_url ?? undefined,
    projectContext: row.project_context,
    overallScore: row.overall_score,
    scoreTier: row.score_tier,
    answers: row.answers,
    aiFeedback: row.ai_feedback,
    sectionScores: row.section_scores,
    overallInsight: row.overall_insight,
    isPublic: row.is_public,
  };
}

export function reportToRow(report: ShipReport): DatabaseReportRow {
  return {
    id: report.id,
    session_id: report.sessionId,
    created_at: report.createdAt,
    project_name: report.projectName,
    project_url: report.projectUrl ?? null,
    project_context: report.projectContext,
    overall_score: report.overallScore,
    score_tier: report.scoreTier,
    answers: report.answers,
    ai_feedback: report.aiFeedback,
    section_scores: report.sectionScores,
    overall_insight: report.overallInsight,
    is_public: report.isPublic,
  };
}
