import { NextRequest } from "next/server";
import { z } from "zod";
import { evaluateSection, formatSse, generateOverallInsight } from "@/src/lib/evaluate";
import { answerLimitLabel, MAX_ANSWER_CHARACTERS, MIN_ANSWER_CHARACTERS } from "@/src/lib/answer-limits";
import { projectContextSchema } from "@/src/lib/project-context";
import { QUESTIONS, SECTIONS, SECTION_ORDER, getSectionQuestions } from "@/src/lib/questions";
import { clientIpFromHeaders, consumeRateLimitSlot, hashIp, parseBoundedJsonRequest } from "@/src/lib/request-security";
import { computeOverallScore } from "@/src/lib/scoring";
import { countRecentReportsForSession, saveReport, sessionExists } from "@/src/lib/supabase";

const MAX_REPORT_REQUEST_BYTES = 80_000;
const TRANSIENT_REPORT_LIMIT = 8;
const TRANSIENT_REPORT_WINDOW_MS = 10 * 60 * 1000;
const MAX_REPORTS_PER_SESSION_PER_HOUR = 4;
const EXPECTED_QUESTION_IDS = new Set(QUESTIONS.map((question) => question.id));

const sseHeaders = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-store, no-transform",
};

function sseError(message: string, status: number, extraHeaders?: Record<string, string>) {
  return new Response(formatSse({ type: "error", message }), {
    status,
    headers: { ...sseHeaders, ...(extraHeaders ?? {}) },
  });
}

function questionLabelFromIssue(issue: z.core.$ZodIssue) {
  const questionId = typeof issue.path[1] === "string" ? issue.path[1] : undefined;
  const question = questionId ? QUESTIONS.find((item) => item.id === questionId) : undefined;
  return question ? `Question ${question.index + 1}` : "One answer";
}

function reportValidationMessage(error: z.ZodError) {
  const answerLengthIssue = error.issues.find(
    (issue) => issue.path[0] === "answers" && (issue.code === "too_big" || issue.code === "too_small"),
  );

  if (answerLengthIssue?.code === "too_big") {
    return `${questionLabelFromIssue(answerLengthIssue)} is too long. Keep each answer to ${answerLimitLabel()} characters or less.`;
  }

  if (answerLengthIssue?.code === "too_small") {
    return `${questionLabelFromIssue(answerLengthIssue)} needs at least ${MIN_ANSWER_CHARACTERS} characters.`;
  }

  const customIssue = error.issues.find((issue) => issue.code === "custom");
  return customIssue?.message ?? "Report request is invalid. Check the saved setup and answers, then try again.";
}

const answersSchema = z
  .record(z.string().min(1), z.string().trim().min(MIN_ANSWER_CHARACTERS).max(MAX_ANSWER_CHARACTERS))
  .superRefine((answers, context) => {
  const answerIds = Object.keys(answers);
  const unknownIds = answerIds.filter((id) => !EXPECTED_QUESTION_IDS.has(id));
  const missingIds = QUESTIONS.map((question) => question.id).filter((id) => !(id in answers));

  if (unknownIds.length > 0) {
    context.addIssue({
      code: "custom",
      message: `Unexpected answer ids: ${unknownIds.join(", ")}`,
    });
  }

  if (missingIds.length > 0) {
    context.addIssue({
      code: "custom",
      message: `Missing answer ids: ${missingIds.join(", ")}`,
    });
  }
  });

const reportRequestSchema = z.object({
  sessionId: z.string().uuid(),
  projectName: z.string().min(1).max(60),
  projectUrl: z.string().url().optional().or(z.literal("")).transform((value) => value || undefined),
  projectContext: projectContextSchema,
  answers: answersSchema,
});

export async function POST(request: NextRequest) {
  const body = await parseBoundedJsonRequest(request, {
    maxBytes: MAX_REPORT_REQUEST_BYTES,
    tooLargeMessage: "Report request is too large.",
    invalidJsonMessage: "Report request body must be valid JSON.",
  });
  if (!body.ok) return sseError(body.message, body.status);

  const payload = reportRequestSchema.safeParse(body.data);

  if (!payload.success) {
    return sseError(reportValidationMessage(payload.error), 400);
  }

  const reportPayload = payload.data;
  const ipHash = hashIp(clientIpFromHeaders(request.headers));
  const rateLimit = consumeRateLimitSlot(`reports:${ipHash ?? reportPayload.sessionId}`, TRANSIENT_REPORT_LIMIT, TRANSIENT_REPORT_WINDOW_MS);
  if (!rateLimit.allowed) {
    return sseError("Too many report requests. Try again shortly.", 429, { "Retry-After": String(rateLimit.retryAfterSeconds) });
  }

  if (!(await sessionExists(reportPayload.sessionId))) {
    return sseError("Session expired. Reload the page and try again.", 403);
  }

  const recentReportCutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const recentReportsForSession = await countRecentReportsForSession(reportPayload.sessionId, recentReportCutoff);
  if (recentReportsForSession >= MAX_REPORTS_PER_SESSION_PER_HOUR) {
    return sseError("This session has reached the report limit. Start a new session later.", 429, { "Retry-After": "3600" });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: unknown) => controller.enqueue(encoder.encode(formatSse(event)));

      try {
        const allEvaluations: Awaited<ReturnType<typeof evaluateSection>> = {};

        for (const sectionId of SECTION_ORDER) {
          const sectionQuestions = getSectionQuestions(sectionId);
          send({ type: "section_start", sectionId });
          const evaluations = await evaluateSection(sectionId, sectionQuestions, reportPayload.answers, reportPayload.projectContext);
          Object.assign(allEvaluations, evaluations);
          send({ type: "section_complete", sectionId, evaluations });
        }

        const { overall, sectionScores, tier } = computeOverallScore(allEvaluations, QUESTIONS, SECTIONS);
        const overallInsight = await generateOverallInsight({
          context: reportPayload.projectContext,
          sectionScores,
          evaluations: allEvaluations,
        });
        const report = await saveReport({
          sessionId: reportPayload.sessionId,
          projectName: reportPayload.projectName,
          projectUrl: reportPayload.projectUrl,
          projectContext: reportPayload.projectContext,
          answers: reportPayload.answers,
          aiFeedback: allEvaluations,
          sectionScores,
          overallScore: overall,
          scoreTier: tier,
          overallInsight,
        });

        send({
          type: "report_complete",
          reportId: report.id,
          overallScore: overall,
          tier,
          sectionScores,
          overallInsight,
        });
      } catch (error) {
        send({ type: "error", message: (error as Error).message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...sseHeaders,
      Connection: "keep-alive",
    },
  });
}
