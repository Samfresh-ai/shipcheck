import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionBootstrap } from "@/components/SessionBootstrap";

const initialize = vi.fn();
const identify = vi.fn();
const updateOptions = vi.fn();

describe("SessionBootstrap", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.__shipcheckPendoInitialized = false;
    window.pendo = { initialize, identify, updateOptions };
    initialize.mockClear();
    identify.mockClear();
    updateOptions.mockClear();
    vi.restoreAllMocks();
  });

  it("initializes analytics with an existing stored session id", () => {
    window.localStorage.setItem("shipcheck_session_id", "session-existing");

    render(<SessionBootstrap />);

    expect(initialize).toHaveBeenCalledWith({
      visitor: { id: "session-existing" },
      account: { id: "shipcheck-public" },
    });
  });

  it("creates a session and initializes analytics with that visitor id", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      json: () => Promise.resolve({ sessionId: "session-created" }),
    } as Response);

    render(<SessionBootstrap />);

    await waitFor(() => {
      expect(window.localStorage.getItem("shipcheck_session_id")).toBe("session-created");
      expect(initialize).toHaveBeenCalledWith({
        visitor: { id: "session-created" },
        account: { id: "shipcheck-public" },
      });
    });
  });
});
