import { NextRequest } from "next/server";
import { z } from "zod";
import { evaluateSection, formatSse, generateOverallInsight } from "@/src/lib/evaluate";
import { projectContextSchema } from "@/src/lib/project-context";
import { QUESTIONS, SECTIONS, SECTION_ORDER, getSectionQuestions } from "@/src/lib/questions";
import { clientIpFromHeaders, consumeRateLimitSlot, hashIp } from "@/src/lib/request-security";
import { computeOverallScore } from "@/src/lib/scoring";
import { countRecentReportsForSession, saveReport, sessionExists } from "@/src/lib/supabase";

const MAX_REPORT_REQUEST_BYTES = 40_000;
const MAX_ANSWER_CHARACTERS = 1_200;
const REPORT_SECTION_CONCURRENCY = SECTION_ORDER.length;
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

async function parseBoundedJson(request: NextRequest): Promise<{ ok: true; data: unknown } | { ok: false; response: Response }> {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_REPORT_REQUEST_BYTES) {
    return { ok: false, response: sseError("Report request is too large.", 413) };
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_REPORT_REQUEST_BYTES) {
    return { ok: false, response: sseError("Report request is too large.", 413) };
  }

  try {
    return { ok: true, data: JSON.parse(rawBody) };
  } catch {
    return { ok: false, response: sseError("Report request body must be valid JSON.", 400) };
  }
}

const answersSchema = z.record(z.string().min(1), z.string().trim().min(20).max(MAX_ANSWER_CHARACTERS)).superRefine((answers, context) => {
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
  const body = await parseBoundedJson(request);
  if (!body.ok) return body.response;

  const payload = reportRequestSchema.safeParse(body.data);

  if (!payload.success) {
    return sseError(payload.error.message, 400);
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
        const allEvaluations = {};

        let nextSectionIndex = 0;
        const sectionResults = new Array<{
          sectionId: (typeof SECTION_ORDER)[number];
          evaluations: Awaited<ReturnType<typeof evaluateSection>> | undefined;
          error: Error | undefined;
        }>(SECTION_ORDER.length);

        async function worker() {
          while (nextSectionIndex < SECTION_ORDER.length) {
            const currentIndex = nextSectionIndex;
            nextSectionIndex += 1;
            const sectionId = SECTION_ORDER[currentIndex];
            send({ type: "section_start", sectionId });
            try {
              const sectionQuestions = getSectionQuestions(sectionId);
              const evaluations = await evaluateSection(sectionId, sectionQuestions, reportPayload.answers, reportPayload.projectContext);
              send({ type: "section_complete", sectionId, evaluations });
              sectionResults[currentIndex] = { sectionId, evaluations, error: undefined };
            } catch (error) {
              sectionResults[currentIndex] = { sectionId, evaluations: undefined, error: error as Error };
            }
          }
        }

        await Promise.all(Array.from({ length: Math.min(REPORT_SECTION_CONCURRENCY, SECTION_ORDER.length) }, () => worker()));

        const failedSection = sectionResults.find((result) => result.error);
        if (failedSection?.error) {
          throw new Error(`${failedSection.sectionId} evaluation failed: ${failedSection.error.message}`);
        }

        for (const { evaluations } of sectionResults) {
          if (!evaluations) continue;
          Object.assign(allEvaluations, evaluations);
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
