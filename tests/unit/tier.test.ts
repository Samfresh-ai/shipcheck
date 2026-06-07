import { describe, expect, it } from "vitest";
import { TIER_CONFIG } from "@/src/lib/scoring";

describe("TIER_CONFIG", () => {
  it("has all readiness tiers with label, color, and message", () => {
    expect(Object.keys(TIER_CONFIG).sort()).toEqual(["ALMOST", "GETTING_THERE", "NOT_READY", "SHIP_IT"].sort());
    Object.values(TIER_CONFIG).forEach((tier) => {
      expect(tier.label).toBeTruthy();
      expect(tier.color).toBeTruthy();
      expect(tier.message).toBeTruthy();
    });
  });
});
