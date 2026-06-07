import OpenAI from "openai";
import { CATEGORY_LABELS, SECTIONS, STAGE_LABELS, type ProjectContext, type Question, type SectionId } from "./questions";
import { tierForScore, type QuestionEvaluation, type SectionEvaluations } from "./scoring";

type OpenAiEvaluationResponse = {
  evaluations: SectionEvaluations;
};

function evaluationInstructions(sectionId: SectionId, context: ProjectContext): string {
  const section = SECTIONS[sectionId];
  return `You are a brutally honest product advisor evaluating ONE SECTION of a builder's pre-launch readiness check.
Your job is not to be encouraging. Your job is to find the real weaknesses in their thinking so they can fix them before shipping.

Product being evaluated:
- Name: ${context.productName}
- Category: ${CATEGORY_LABELS[context.category]}
- Stage: ${STAGE_LABELS[context.stage]}
- What it does: ${context.oneLiner}

Use this product context to make your feedback specific to this product type. Generic PM advice is a failure mode.

You will receive questions and answers from the "${section.label}" section.
For each answer, evaluate specificity, evidence, clarity, and honesty.

Score 0-10:
8-10 -> GREEN: specific, evidenced, clear, honest
5-7 -> AMBER: directionally right but needs sharper thinking
0-4 -> RED: vague, assumption-based, or evasive

For each answer, provide score, tier, and 2-3 sentences of specific feedback. RED items must include action: one concrete next step, maximum 15 words, starting with a verb.

Rules:
- Never use "great", "awesome", "excellent", or "good job".
- Never say "I can see you've put thought into this".
- Be direct. Assume the builder can handle honest feedback.
- If an answer is empty or under 10 characters, score it 0, tier RED, feedback "No substantive answer provided.", action "Answer this question fully before shipping."
- Output only valid JSON shaped as {"evaluations":{"questionId":{"score":0,"tier":"RED","feedback":"...","action":"..."}}}.`;
}

function sectionPayload(questions: Question[], answers: Record<string, string>): string {
  return JSON.stringify(
    questions.map((question) => ({
      id: question.id,
      question: question.question,
      answer: answers[question.id] ?? "",
      weight: question.weight,
    })),
    null,
    2,
  );
}

function normalizeEvaluation(question: Question, evaluation: Partial<QuestionEvaluation> | undefined): QuestionEvaluation {
  const score = Math.max(0, Math.min(10, Math.round(Number(evaluation?.score ?? 0))));
  const tier = evaluation?.tier && ["RED", "AMBER", "GREEN"].includes(evaluation.tier) ? evaluation.tier : tierForScore(score);
  const feedback = typeof evaluation?.feedback === "string" && evaluation.feedback.trim()
    ? evaluation.feedback.trim()
    : "No substantive answer provided.";
  const normalized: QuestionEvaluation = { score, tier, feedback };

  if (tier === "RED") {
    normalized.action =
      typeof evaluation?.action === "string" && evaluation.action.trim()
        ? evaluation.action.trim()
        : "Answer this question fully before shipping.";
  }

  if ((question.id && question) && tier !== "RED") {
    delete normalized.action;
  }

  return normalized;
}

function mockEvaluateSection(questions: Question[], answers: Record<string, string>): SectionEvaluations {
  return Object.fromEntries(
    questions.map((question) => {
      const answer = answers[question.id] ?? "";
      const score = answer.trim().length < 20 ? 3 : answer.length > 120 ? 8 : 6;
      const tier = tierForScore(score);
      return [
        question.id,
        {
          score,
          tier,
          feedback:
            tier === "GREEN"
              ? "This answer is specific enough to evaluate and gives a concrete signal about the product."
              : "This answer needs sharper evidence and a more concrete product-specific detail before shipping.",
          ...(tier === "RED" ? { action: "Rewrite this with one specific user fact." } : {}),
        },
      ];
    }),
  );
}

export async function evaluateSection(
  sectionId: SectionId,
  questions: Question[],
  answers: Record<string, string>,
  context: ProjectContext,
): Promise<SectionEvaluations> {
  if (process.env.NODE_ENV === "test" || process.env.SHIPCHECK_USE_MOCK_AI === "1") {
    return mockEvaluateSection(questions, answers);
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for live evaluation");
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: process.env.OPENAI_EVALUATION_MODEL || "gpt-5-mini",
    instructions: evaluationInstructions(sectionId, context),
    input: sectionPayload(questions, answers),
    max_output_tokens: 1800,
  });

  const text = response.output_text?.trim();
  if (!text) {
    throw new Error("OpenAI returned an empty evaluation response");
  }

  let parsed: OpenAiEvaluationResponse;
  try {
    parsed = JSON.parse(text) as OpenAiEvaluationResponse;
  } catch (error) {
    throw new Error(`OpenAI evaluation JSON parse failed: ${(error as Error).message}`);
  }

  return Object.fromEntries(
    questions.map((question) => [question.id, normalizeEvaluation(question, parsed.evaluations?.[question.id])]),
  );
}

export async function generateOverallInsight(input: {
  context: ProjectContext;
  sectionScores: Record<SectionId, number>;
  evaluations: SectionEvaluations;
}): Promise<string> {
  const redItems = Object.entries(input.evaluations)
    .filter(([, evaluation]) => evaluation.tier === "RED")
    .map(([questionId, evaluation]) => `${questionId}: ${evaluation.feedback}`)
    .join("\n");

  if (process.env.NODE_ENV === "test" || process.env.SHIPCHECK_USE_MOCK_AI === "1" || !process.env.OPENAI_API_KEY) {
    return redItems
      ? "The biggest blocker is that at least one answer is still assumption-heavy. Fix the RED items before treating this as launch-ready."
      : "The answers are coherent enough to ship, but the product still needs live user behavior data after launch.";
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: process.env.OPENAI_EVALUATION_MODEL || "gpt-5-mini",
    instructions:
      "You are a product advisor. Write 2-3 direct sentences identifying the single biggest pattern across all answers. Do not repeat scores. Output plain text only.",
    input: JSON.stringify({
      product: input.context,
      sectionScores: input.sectionScores,
      redItems,
    }),
    max_output_tokens: 420,
  });

  return response.output_text?.trim() || "The report completed, but no overall insight was returned.";
}

export function formatSse(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}
