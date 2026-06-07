import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { SAMPLE_REPORT, SAMPLE_REPORT_ID } from "./sample-report";
import type { DatabaseReportRow, ReportInsert, ShipReport } from "./report-types";
import { reportToRow, rowToReport } from "./report-types";

type LocalState = {
  sessions: Map<string, { id: string; createdAt: string; userAgent?: string; ipHash?: string }>;
  reports: Map<string, ShipReport>;
  dropoffs: unknown[];
  feedback: unknown[];
};

const globalForDb = globalThis as typeof globalThis & { __shipcheckLocalDb?: LocalState };

function localDb(): LocalState {
  if (!globalForDb.__shipcheckLocalDb) {
    globalForDb.__shipcheckLocalDb = {
      sessions: new Map(),
      reports: new Map([[SAMPLE_REPORT.id, SAMPLE_REPORT], [SAMPLE_REPORT_ID, SAMPLE_REPORT]]),
      dropoffs: [],
      feedback: [],
    };
  }

  return globalForDb.__shipcheckLocalDb;
}

export function supabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function createSession(input: { userAgent?: string; ipHash?: string }): Promise<string> {
  const client = supabaseAdmin();
  if (!client) {
    const id = randomUUID();
    localDb().sessions.set(id, { id, createdAt: new Date().toISOString(), userAgent: input.userAgent, ipHash: input.ipHash });
    return id;
  }

  const { data, error } = await client
    .from("sessions")
    .insert({ user_agent: input.userAgent, ip_hash: input.ipHash })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(error?.message ?? "Could not create session");
  }

  return data.id;
}

export async function saveReport(input: ReportInsert): Promise<ShipReport> {
  const id = randomUUID();
  const report: ShipReport = {
    id,
    sessionId: input.sessionId,
    createdAt: new Date().toISOString(),
    projectName: input.projectName,
    projectUrl: input.projectUrl,
    projectContext: input.projectContext,
    overallScore: input.overallScore,
    scoreTier: input.scoreTier,
    answers: input.answers,
    aiFeedback: input.aiFeedback,
    sectionScores: input.sectionScores,
    overallInsight: input.overallInsight,
    isPublic: input.isPublic ?? true,
  };

  const client = supabaseAdmin();
  if (!client) {
    localDb().reports.set(id, report);
    return report;
  }

  const row = reportToRow(report);
  const { data, error } = await client.from("reports").insert(row).select("*").single<DatabaseReportRow>();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not save report");
  }

  return rowToReport(data);
}

export async function getPublicReport(id: string): Promise<ShipReport | null> {
  const client = supabaseAdmin();
  if (!client) {
    return localDb().reports.get(id) ?? null;
  }

  const { data, error } = await client
    .from("reports")
    .select("*")
    .eq("id", id)
    .eq("is_public", true)
    .single<DatabaseReportRow>();

  if (error || !data) {
    return id === SAMPLE_REPORT_ID ? SAMPLE_REPORT : null;
  }

  return rowToReport(data);
}

export async function recordDropoff(input: {
  sessionId: string;
  reportId?: string;
  questionIndex: number;
  sectionId: string;
  eventType: "exit" | "back" | "skip";
}): Promise<void> {
  const client = supabaseAdmin();
  if (!client) {
    localDb().dropoffs.push(input);
    return;
  }

  const { error } = await client.from("drop_off_events").insert({
    session_id: input.sessionId,
    report_id: input.reportId,
    question_index: input.questionIndex,
    section_id: input.sectionId,
    event_type: input.eventType,
  });

  if (error) throw new Error(error.message);
}

export async function recordFeedback(input: {
  reportId: string;
  questionId: string;
  reaction: "helpful" | "not_helpful";
}): Promise<void> {
  const client = supabaseAdmin();
  if (!client) {
    localDb().feedback.push(input);
    return;
  }

  const { error } = await client.from("feedback_reactions").insert({
    report_id: input.reportId,
    question_id: input.questionId,
    reaction: input.reaction,
  });

  if (error) throw new Error(error.message);
}
