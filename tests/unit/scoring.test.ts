import { describe, expect, it } from "vitest";
import { QUESTIONS, SECTIONS } from "@/src/lib/questions";
import { computeOverallScore, scoreTier, tierForScore, type QuestionEvaluation } from "@/src/lib/scoring";

function evaluationsFor(score: number): Record<string, QuestionEvaluation> {
  return Object.fromEntries(
    QUESTIONS.map((question) => [
      question.id,
      { score, tier: score >= 8 ? "GREEN" : score >= 5 ? "AMBER" : "RED", feedback: "test" },
    ]),
  );
}

describe("computeOverallScore", () => {
  it.each([
    [3.7, 37, "NOT_READY"],
    [3.8, 38, "GETTING_THERE"],
    [6.1, 61, "GETTING_THERE"],
    [6.2, 62, "ALMOST"],
    [8.1, 81, "ALMOST"],
    [8.2, 82, "SHIP_IT"],
  ] as const)("maps %s average score to %s/%s", (rawScore, expectedOverall, expectedTier) => {
    const result = computeOverallScore(evaluationsFor(rawScore), QUESTIONS, SECTIONS);
    expect(result.overall).toBe(expectedOverall);
    expect(result.tier).toBe(expectedTier);
  });

  it("exposes direct tier boundaries", () => {
    expect(scoreTier(37)).toBe("NOT_READY");
    expect(scoreTier(38)).toBe("GETTING_THERE");
    expect(scoreTier(61)).toBe("GETTING_THERE");
    expect(scoreTier(62)).toBe("ALMOST");
    expect(scoreTier(81)).toBe("ALMOST");
    expect(scoreTier(82)).toBe("SHIP_IT");
  });

  it("maps question score tiers", () => {
    expect(tierForScore(4)).toBe("RED");
    expect(tierForScore(5)).toBe("AMBER");
    expect(tierForScore(8)).toBe("GREEN");
  });
});
