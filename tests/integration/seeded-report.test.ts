import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/reports/[id]/route";
import { SAMPLE_REPORT_ID } from "@/src/lib/sample-report";
import { jsonRequest } from "../api/helpers";

describe("seeded sample report", () => {
  it("returns the sample report without auth", async () => {
    const response = await GET(jsonRequest(`/api/reports/${SAMPLE_REPORT_ID}`), { params: { id: SAMPLE_REPORT_ID } });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.projectName).toBe("ShipCheck");
    expect(json.overallScore).toBe(67);
  });
});
