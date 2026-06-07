import { describe, expect, it } from "vitest";
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
});
