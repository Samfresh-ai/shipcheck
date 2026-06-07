import { NextRequest, NextResponse } from "next/server";
import { getPublicReport } from "@/src/lib/supabase";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const report = await getPublicReport(params.id);

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json(report);
}
