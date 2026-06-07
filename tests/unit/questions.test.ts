import { describe, expect, it } from "vitest";
import { QUESTIONS } from "@/src/lib/questions";

describe("QUESTIONS", () => {
  it("contains exactly 20 complete questions", () => {
    expect(QUESTIONS).toHaveLength(20);
    QUESTIONS.forEach((question, index) => {
      expect(question.id).toBeTruthy();
      expect(question.sectionId).toBeTruthy();
      expect(question.index).toBe(index);
      expect(question.weight).toBeGreaterThanOrEqual(1);
      expect(question.question).toBeTruthy();
      expect(question.subtext).toBeTruthy();
      expect(question.placeholder).toBeTruthy();
    });
  });
});
