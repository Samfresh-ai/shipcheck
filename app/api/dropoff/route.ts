import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { recordDropoff } from "@/src/lib/supabase";

const dropoffSchema = z.object({
  sessionId: z.string().uuid(),
  reportId: z.string().uuid().optional(),
  questionIndex: z.number().int().min(0),
  sectionId: z.string().min(1),
  eventType: z.enum(["exit", "back", "skip"]),
});

export async function POST(request: NextRequest) {
  const payload = dropoffSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: payload.error.message }, { status: 400 });
  }

  await recordDropoff(payload.data);
  return NextResponse.json({ ok: true });
}
