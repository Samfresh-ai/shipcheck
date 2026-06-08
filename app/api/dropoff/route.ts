import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { recordDropoff, sessionExists } from "@/src/lib/supabase";

const dropoffSchema = z.object({
  sessionId: z.string().uuid(),
  reportId: z.string().uuid().optional(),
  questionIndex: z.number().int().min(0),
  sectionId: z.string().min(1),
  eventType: z.enum(["exit", "back", "skip"]),
});

export async function POST(request: NextRequest) {
  const rawBody = await request.json().catch(() => null);
  const payload = dropoffSchema.safeParse(rawBody);

  if (!payload.success) {
    return NextResponse.json({ error: payload.error.message }, { status: 400 });
  }

  const sessionOk = await sessionExists(payload.data.sessionId);
  if (!sessionOk) {
    return NextResponse.json({ ok: false, error: "Session not found" }, { status: 404 });
  }

  try {
    await recordDropoff(payload.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message ?? "Unable to record dropoff" }, { status: 500 });
  }
}
