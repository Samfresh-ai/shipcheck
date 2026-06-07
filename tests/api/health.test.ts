import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("returns status ok with ISO timestamp", async () => {
    const response = GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.status).toBe("ok");
    expect(new Date(json.timestamp).toISOString()).toBe(json.timestamp);
  });
});
