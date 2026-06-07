import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/src/lib/supabase";

function hashIp(ip: string | null): string | undefined {
  if (!ip) return undefined;
  return Buffer.from(ip).toString("base64url").slice(0, 24);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as { userAgent?: string };
    const userAgent = body.userAgent || request.headers.get("user-agent") || undefined;
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const sessionId = await createSession({ userAgent, ipHash: hashIp(ip) });

    return NextResponse.json({ sessionId });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
