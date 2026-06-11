import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { QUESTIONS } from "@/src/lib/questions";
import { clientIpFromHeaders, consumeRateLimitSlot, hashIp, parseBoundedJsonRequest } from "@/src/lib/request-security";
import { recordFeedback } from "@/src/lib/supabase";

const MAX_FEEDBACK_REQUEST_BYTES = 2_000;
const FEEDBACK_LIMIT = 60;
const FEEDBACK_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const QUESTION_IDS = new Set(QUESTIONS.map((question) => question.id));

const feedbackSchema = z.object({
  reportId: z.string().uuid(),
  questionId: z.string().min(1).max(20).refine((id) => QUESTION_IDS.has(id), "Unknown question id"),
  reaction: z.enum(["helpful", "not_helpful"]),
});

export async function POST(request: NextRequest) {
  const ipHash = hashIp(clientIpFromHeaders(request.headers));
  const rateLimit = consumeRateLimitSlot(`feedback:${ipHash ?? "unknown"}`, FEEDBACK_LIMIT, FEEDBACK_LIMIT_WINDOW_MS);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many feedback requests. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const body = await parseBoundedJsonRequest(request, {
    maxBytes: MAX_FEEDBACK_REQUEST_BYTES,
    invalidJsonMessage: "Feedback request body must be valid JSON.",
  });
  if (!body.ok) {
    return NextResponse.json({ error: body.message }, { status: body.status });
  }

  const payload = feedbackSchema.safeParse(body.data);

  if (!payload.success) {
    return NextResponse.json({ error: payload.error.message }, { status: 400 });
  }

  await recordFeedback(payload.data);
  return NextResponse.json({ ok: true });
}
