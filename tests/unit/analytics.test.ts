import { beforeEach, describe, expect, it, vi } from "vitest";
import { getOrCreateAnalyticsVisitorId, track } from "@/src/lib/analytics";

describe("analytics", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.pendo = { track: vi.fn() };
  });

  it("redacts raw report and session identifiers from event properties", () => {
    track("report_shared", {
      reportId: "00000000-0000-4000-8000-000000000067",
      sessionId: "00000000-0000-4000-8000-000000000001",
      score: 67,
      tier: "ALMOST",
      errorMessage: "Provider failed with sensitive detail.",
    });

    expect(window.pendo?.track).toHaveBeenCalledWith("report_shared", {
      score: 67,
      tier: "ALMOST",
    });
  });

  it("uses a separate analytics visitor id instead of the backend session id", () => {
    window.localStorage.setItem("shipcheck_session_id", "session-id");
    window.localStorage.setItem("shipcheck_analytics_id", "analytics-id");

    expect(getOrCreateAnalyticsVisitorId()).toBe("analytics-id");
  });
});
