import { describe, expect, it } from "vitest";
import { projectContextSchema } from "@/src/lib/project-context";

describe("projectContextSchema", () => {
  it("validates required fields", () => {
    const parsed = projectContextSchema.parse({
      productName: "ShipCheck",
      category: "developer_tool",
      stage: "mvp_launched",
      oneLiner: "A product readiness check.",
    });

    expect(parsed.productName).toBe("ShipCheck");
    expect(parsed.productUrl).toBeUndefined();
  });

  it("allows an optional URL", () => {
    const parsed = projectContextSchema.parse({
      productName: "ShipCheck",
      productUrl: "https://shipcheck.vercel.app",
      category: "developer_tool",
      stage: "mvp_launched",
      oneLiner: "A product readiness check.",
    });

    expect(parsed.productUrl).toBe("https://shipcheck.vercel.app");
  });
});
