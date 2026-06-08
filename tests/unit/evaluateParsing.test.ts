import { describe, expect, it, vi } from "vitest";
import { parseEvaluationJsonResponse } from "@/src/lib/evaluate";

describe("parseEvaluationJsonResponse", () => {
  it("extracts valid JSON from fenced model output", async () => {
    const parsed = await parseEvaluationJsonResponse(`
      \`\`\`json
      {"evaluations":{"u1":{"score":7,"tier":"AMBER","feedback":"Specific, but needs proof."}}}
      \`\`\`
    `);

    expect(parsed.evaluations.u1).toEqual({
      score: 7,
      tier: "AMBER",
      feedback: "Specific, but needs proof.",
    });
  });

  it("repairs missing commas between known evaluation properties without a model retry", async () => {
    const repair = vi.fn();

    const parsed = await parseEvaluationJsonResponse(
      '{"evaluations":{"u1":{"score":4 "tier":"RED","feedback":"The answer has a concrete user but no proof." "action":"Add one interview detail."} "u2":{"score":7,"tier":"AMBER","feedback":"Specific but thin."}}}',
      repair,
    );

    expect(repair).not.toHaveBeenCalled();
    expect(parsed.evaluations.u1).toEqual({
      score: 4,
      tier: "RED",
      feedback: "The answer has a concrete user but no proof.",
      action: "Add one interview detail.",
    });
    expect(parsed.evaluations.u2.tier).toBe("AMBER");
  });

  it("uses the model repair fallback for malformed JSON outside the common repair pattern", async () => {
    const repair = vi.fn().mockResolvedValue(
      '{"evaluations":{"u1":{"score":4,"tier":"RED","feedback":"The answer has a concrete user but no proof.","action":"Add one interview detail."}}}',
    );

    const parsed = await parseEvaluationJsonResponse(
      '{"evaluations":{"u1":{"score":4,"tier":"RED","feedback":"The answer has a concrete user but no proof.","action":"Add one interview detail.",',
      repair,
    );

    expect(repair).toHaveBeenCalledOnce();
    expect(repair.mock.calls[0][1].message).toContain("Expected");
    expect(parsed.evaluations.u1).toEqual({
      score: 4,
      tier: "RED",
      feedback: "The answer has a concrete user but no proof.",
      action: "Add one interview detail.",
    });
  });
});
