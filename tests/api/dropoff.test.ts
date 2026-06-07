import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/dropoff/route";
import { jsonRequest } from "./helpers";

describe("POST /api/dropoff", () => {
  it("records a drop-off event", async () => {
    const response = await POST(
      jsonRequest("/api/dropoff", {
        sessionId: "session-1",
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
