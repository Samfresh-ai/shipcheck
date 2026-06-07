import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { recordFeedback } from "@/src/lib/supabase";

const feedbackSchema = z.object({
  reportId: z.string().uuid(),
  questionId: z.string().min(1),
  reaction: z.enum(["helpful", "not_helpful"]),
});

export async function POST(request: NextRequest) {
  const payload = feedbackSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: payload.error.message }, { status: 400 });
  }

  await recordFeedback(payload.data);
  return NextResponse.json({ ok: true });
}
