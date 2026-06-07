import { NextRequest } from "next/server";
import { z } from "zod";
import { evaluateSection, formatSse, generateOverallInsight } from "@/src/lib/evaluate";
import { projectContextSchema } from "@/src/lib/project-context";
import { QUESTIONS, SECTIONS, SECTION_ORDER, getSectionQuestions } from "@/src/lib/questions";
import { computeOverallScore } from "@/src/lib/scoring";
import { saveReport } from "@/src/lib/supabase";

const reportRequestSchema = z.object({
  sessionId: z.string().min(1),
  projectName: z.string().min(1).max(60),
  projectUrl: z.string().url().optional().or(z.literal("")).transform((value) => value || undefined),
  projectContext: projectContextSchema,
  answers: z.record(z.string().min(1), z.string()),
});

export async function POST(request: NextRequest) {
  const payload = reportRequestSchema.safeParse(await request.json());

  if (!payload.success) {
    return new Response(formatSse({ type: "error", message: payload.error.message }), {
      status: 400,
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: unknown) => controller.enqueue(encoder.encode(formatSse(event)));

      try {
        const allEvaluations = {};

        const sectionResults = await Promise.all(
          SECTION_ORDER.map(async (sectionId) => {
            send({ type: "section_start", sectionId });
            try {
              const sectionQuestions = getSectionQuestions(sectionId);
              const evaluations = await evaluateSection(sectionId, sectionQuestions, payload.data.answers, payload.data.projectContext);
              send({ type: "section_complete", sectionId, evaluations });
              return { sectionId, evaluations, error: undefined };
            } catch (error) {
              return { sectionId, evaluations: undefined, error: error as Error };
            }
          }),
        );

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
          context: payload.data.projectContext,
          sectionScores,
          evaluations: allEvaluations,
        });
        const report = await saveReport({
          sessionId: payload.data.sessionId,
          projectName: payload.data.projectName,
          projectUrl: payload.data.projectUrl,
          projectContext: payload.data.projectContext,
          answers: payload.data.answers,
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
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
    },
  });
}
