import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/src/lib/supabase";
import { clientIpFromHeaders, consumeRateLimitSlot, hashIp, parseBoundedJsonRequest } from "@/src/lib/request-security";

const MAX_SESSION_REQUEST_BYTES = 2_000;
const SESSION_LIMIT = 30;
const SESSION_LIMIT_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const ip = clientIpFromHeaders(request.headers);
    const ipHash = hashIp(ip);
    const rateLimit = consumeRateLimitSlot(`sessions:${ipHash ?? "unknown"}`, SESSION_LIMIT, SESSION_LIMIT_WINDOW_MS);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many session requests. Try again shortly." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }

    const body = await parseBoundedJsonRequest(request, {
      maxBytes: MAX_SESSION_REQUEST_BYTES,
      emptyBodyValue: {},
      invalidJsonMessage: "Session request body must be valid JSON.",
    });
    if (!body.ok) {
      return NextResponse.json({ error: body.message }, { status: body.status });
    }

    const parsedBody = body.data as { userAgent?: string };
    const userAgent = (parsedBody.userAgent || request.headers.get("user-agent") || undefined)?.slice(0, 500);
    const sessionId = await createSession({ userAgent, ipHash });

    return NextResponse.json({ sessionId });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
