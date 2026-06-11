import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST as createSession } from "@/app/api/sessions/route";
import { POST } from "@/app/api/dropoff/route";
import { jsonRequest } from "./helpers";

async function sessionId() {
  const response = await createSession(jsonRequest("/api/sessions", { userAgent: "vitest" }));
  const json = await response.json();
  return json.sessionId as string;
}

describe("POST /api/dropoff", () => {
  it("records a drop-off event", async () => {
    const validSessionId = await sessionId();
    const response = await POST(
      jsonRequest("/api/dropoff", {
        sessionId: validSessionId,
        questionIndex: 4,
        sectionId: "problem",
        eventType: "exit",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("rejects invalid events", async () => {
    const response = await POST(jsonRequest("/api/dropoff", { sessionId: "", questionIndex: -1, sectionId: "", eventType: "bad" }));
    expect(response.status).toBe(400);
  });

  it("rejects oversized drop-off request bodies", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/dropoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "00000000-0000-4000-8000-000000000067",
          questionIndex: 4,
          sectionId: "problem",
          eventType: "exit",
          padding: "x".repeat(2_500),
        }),
      }),
    );

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({ error: "Request body is too large." });
  });

  it("rejects malformed drop-off JSON", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/dropoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Drop-off request body must be valid JSON." });
  });
});
