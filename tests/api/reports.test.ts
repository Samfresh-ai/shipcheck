import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/reports/[id]/route";
import { POST as createSession } from "@/app/api/sessions/route";
import { POST } from "@/app/api/reports/route";
import { QUESTIONS } from "@/src/lib/questions";
import { jsonRequest, readSse } from "./helpers";

const answers = Object.fromEntries(QUESTIONS.map((question) => [question.id, `This is a specific enough answer for ${question.id} with useful detail.`]));

async function sessionId() {
  const response = await createSession(jsonRequest("/api/sessions", { userAgent: "vitest" }));
  const json = await response.json();
  return json.sessionId as string;
}

describe("reports API", () => {
  it("streams per-section events and saves final report", async () => {
    const validSessionId = await sessionId();
    const response = await POST(
      jsonRequest("/api/reports", {
        sessionId: validSessionId,
        projectName: "ShipCheck",
        projectContext: {
          productName: "ShipCheck",
          category: "developer_tool",
          stage: "mvp_launched",
          oneLiner: "A product readiness check.",
        },
        answers,
      }),
    );
    const events = await readSse(response);

    expect(events.filter((event) => event.type === "section_start")).toHaveLength(5);
    expect(events.filter((event) => event.type === "section_complete")).toHaveLength(5);
    const complete = events.find((event) => event.type === "report_complete");
    expect(complete.reportId).toMatch(/^[0-9a-f-]{36}$/);
    expect(complete.overallScore).toBeGreaterThan(0);
    expect(complete.tier).toBeTruthy();

    const getResponse = await GET(jsonRequest(`/api/reports/${complete.reportId}`), { params: { id: complete.reportId } });
    expect(getResponse.status).toBe(200);
    const saved = await getResponse.json();
    expect(saved.projectContext.productName).toBe("ShipCheck");
  });

  it("returns an SSE error for invalid payloads", async () => {
    const response = await POST(jsonRequest("/api/reports", { bad: true }));
    expect(response.status).toBe(400);
    const events = await readSse(response);
    expect(events[0].type).toBe("error");
  });

  it("rejects reports before AI work when the session is unknown", async () => {
    const response = await POST(
      jsonRequest("/api/reports", {
        sessionId: "00000000-0000-4000-8000-000000000101",
        projectName: "ShipCheck",
        projectContext: {
          productName: "ShipCheck",
          category: "developer_tool",
          stage: "mvp_launched",
          oneLiner: "A product readiness check.",
        },
        answers,
      }),
    );

    expect(response.status).toBe(403);
    await expect(readSse(response)).resolves.toEqual([{ type: "error", message: "Session expired. Reload the page and try again." }]);
  });

  it("rejects missing, unknown, or oversized answers", async () => {
    const validSessionId = await sessionId();
    const response = await POST(
      jsonRequest("/api/reports", {
        sessionId: validSessionId,
        projectName: "ShipCheck",
        projectContext: {
          productName: "ShipCheck",
          category: "developer_tool",
          stage: "mvp_launched",
          oneLiner: "A product readiness check.",
        },
        answers: { ...answers, unexpected: "This answer should not be accepted.", d1: "x".repeat(1_201) },
      }),
    );

    expect(response.status).toBe(400);
    const events = await readSse(response);
    expect(events[0].message).toContain("Unexpected answer ids");
  });

  it("rejects oversized request bodies", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": "40001" },
        body: "{}",
      }),
    );

    expect(response.status).toBe(413);
    await expect(readSse(response)).resolves.toEqual([{ type: "error", message: "Report request is too large." }]);
  });

  it("returns 404 for unknown public reports", async () => {
    const response = await GET(jsonRequest("/api/reports/missing"), { params: { id: "missing" } });
    expect(response.status).toBe(404);
  });
});
