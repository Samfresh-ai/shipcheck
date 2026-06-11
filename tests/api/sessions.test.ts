import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
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

  it("rejects oversized session request bodies", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAgent: "x".repeat(2_500) }),
      }),
    );

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({ error: "Request body is too large." });
  });

  it("rejects malformed session JSON", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Session request body must be valid JSON." });
  });
});
