import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/sessions/route";
import { jsonRequest } from "./helpers";

describe("POST /api/sessions", () => {
  it("creates an anonymous session", async () => {
    const response = await POST(jsonRequest("/api/sessions", { userAgent: "vitest" }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.sessionId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("falls back to request headers for user agent and IP", async () => {
    const response = await POST(
      new Request("http://localhost:3000/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "user-agent": "vitest-agent",
          "x-forwarded-for": "203.0.113.7, 10.0.0.1",
        },
        body: JSON.stringify({}),
      }) as never,
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.sessionId).toMatch(/^[0-9a-f-]{36}$/);
  });
});
