import { describe, expect, it } from "vitest";
import { normalizeEvaluation } from "@/src/lib/evaluate";

describe("evaluation guardrails", () => {
  it("does not accept empty-answer feedback for a substantive answer", () => {
    const answer =
      "Yes. I spoke to 5 solo builders in the last 30 days through builder communities and launch groups, not friends or family. The most surprising thing they said was that they **already know** they are skipping basic product thinking - they just do not want a 3-hour framework, a Notion template, or another strategy exercise. They want something fast enough to use before launch and blunt enough to stop them from lying to themselves.";

    const result = normalizeEvaluation(
      {
        score: 0,
        tier: "RED",
        feedback: "No substantive answer provided.",
        action: "Answer this question fully before shipping.",
      },
      answer,
    );

    expect(result.score).toBe(2);
    expect(result.tier).toBe("RED");
    expect(result.feedback).not.toMatch(/no substantive answer/i);
    expect(result.feedback).toContain("I spoke to 5 solo builders");
    expect(result.feedback).toContain("The gap is proof");
    expect(result.action).toBe("Add the exact user proof or behavior this answer depends on.");
  });

  it("keeps true blank answers strict", () => {
    const result = normalizeEvaluation(
      {
        score: 8,
        tier: "GREEN",
        feedback: "Specific and evidenced.",
      },
      "   ",
    );

    expect(result).toEqual({
      score: 0,
      tier: "RED",
      feedback: "No substantive answer provided.",
      action: "Answer this question fully before shipping.",
    });
  });

  it("forces tier to match score", () => {
    const result = normalizeEvaluation(
      {
        score: 4,
        tier: "GREEN",
        feedback: "The answer names a real interview source but needs the exact quote.",
        action: "Quote the most surprising interview detail.",
      },
      "I talked to 5 solo builders in launch communities, but I have not written down the exact quote yet.",
    );

    expect(result.score).toBe(4);
    expect(result.tier).toBe("RED");
    expect(result.action).toBe("Quote the most surprising interview detail.");
  });
});
