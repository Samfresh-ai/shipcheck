import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/src/lib/supabase";
import { clientIpFromHeaders, hashIp } from "@/src/lib/request-security";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as { userAgent?: string };
    const userAgent = (body.userAgent || request.headers.get("user-agent") || undefined)?.slice(0, 500);
    const ip = clientIpFromHeaders(request.headers);
    const sessionId = await createSession({ userAgent, ipHash: hashIp(ip) });

    return NextResponse.json({ sessionId });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
