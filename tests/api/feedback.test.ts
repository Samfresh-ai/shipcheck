import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/feedback/route";
import { jsonRequest } from "./helpers";

describe("POST /api/feedback", () => {
  it("records a feedback reaction", async () => {
    const response = await POST(
      jsonRequest("/api/feedback", {
        reportId: "00000000-0000-4000-8000-000000000067",
        questionId: "d1",
        reaction: "helpful",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("rejects invalid feedback", async () => {
    const response = await POST(jsonRequest("/api/feedback", { reportId: "", questionId: "", reaction: "meh" }));
    expect(response.status).toBe(400);
  });

  it("rejects oversized feedback request bodies", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: "00000000-0000-4000-8000-000000000067", questionId: "d1", reaction: "helpful", padding: "x".repeat(2_500) }),
      }),
    );

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({ error: "Request body is too large." });
  });

  it("rejects malformed feedback JSON", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Feedback request body must be valid JSON." });
  });
});
