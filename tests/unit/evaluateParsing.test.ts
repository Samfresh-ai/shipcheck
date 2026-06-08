import { describe, expect, it } from "vitest";
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

  it("repairs missing commas between known evaluation properties", async () => {
    const parsed = await parseEvaluationJsonResponse(
      '{"evaluations":{"u1":{"score":4 "tier":"RED","feedback":"The answer has a concrete user but no proof." "action":"Add one interview detail."} "u2":{"score":7,"tier":"AMBER","feedback":"Specific but thin."}}}',
    );

    expect(parsed.evaluations.u1).toEqual({
      score: 4,
      tier: "RED",
      feedback: "The answer has a concrete user but no proof.",
      action: "Add one interview detail.",
    });
    expect(parsed.evaluations.u2.tier).toBe("AMBER");
  });

  it("repairs broader malformed JSON locally without a provider retry", async () => {
    const parsed = await parseEvaluationJsonResponse(
      "{evaluations:{u1:{score:4,tier:'RED',feedback:'The answer has a concrete user but no proof.',action:'Add one interview detail.',},},}",
    );

    expect(parsed.evaluations.u1).toEqual({
      score: 4,
      tier: "RED",
      feedback: "The answer has a concrete user but no proof.",
      action: "Add one interview detail.",
    });
  });
});
