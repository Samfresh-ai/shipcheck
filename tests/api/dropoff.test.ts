import { describe, expect, it } from "vitest";
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
});
