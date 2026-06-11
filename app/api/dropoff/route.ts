import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SECTIONS } from "@/src/lib/questions";
import { clientIpFromHeaders, consumeRateLimitSlot, hashIp, parseBoundedJsonRequest } from "@/src/lib/request-security";
import { recordDropoff, sessionExists } from "@/src/lib/supabase";

const MAX_DROPOFF_REQUEST_BYTES = 2_000;
const DROPOFF_LIMIT = 120;
const DROPOFF_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const SECTION_IDS = new Set(Object.keys(SECTIONS));

const dropoffSchema = z.object({
  sessionId: z.string().uuid(),
  reportId: z.string().uuid().optional(),
  questionIndex: z.number().int().min(0),
  sectionId: z.string().min(1).max(20).refine((id) => SECTION_IDS.has(id), "Unknown section id"),
  eventType: z.enum(["exit", "back", "skip"]),
});

export async function POST(request: NextRequest) {
  const ipHash = hashIp(clientIpFromHeaders(request.headers));
  const rateLimit = consumeRateLimitSlot(`dropoff:${ipHash ?? "unknown"}`, DROPOFF_LIMIT, DROPOFF_LIMIT_WINDOW_MS);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many drop-off requests. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const body = await parseBoundedJsonRequest(request, {
    maxBytes: MAX_DROPOFF_REQUEST_BYTES,
    invalidJsonMessage: "Drop-off request body must be valid JSON.",
  });
  if (!body.ok) {
    return NextResponse.json({ error: body.message }, { status: body.status });
  }

  const payload = dropoffSchema.safeParse(body.data);

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
