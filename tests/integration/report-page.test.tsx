import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FeedbackCard } from "@/components/report/FeedbackCard";
import { ScoreCircle } from "@/components/report/ScoreCircle";
import { QUESTIONS } from "@/src/lib/questions";
import { SAMPLE_REPORT } from "@/src/lib/sample-report";

describe("report components", () => {
  it("renders score and RED action fields", () => {
    render(
      <>
        <ScoreCircle score={SAMPLE_REPORT.overallScore} />
        <FeedbackCard
          reportId={SAMPLE_REPORT.id}
          question={QUESTIONS.find((question) => question.id === "d1")!}
          answer={SAMPLE_REPORT.answers.d1}
          evaluation={SAMPLE_REPORT.aiFeedback.d1}
        />
      </>,
    );

    expect(screen.getByText(/Next step:/i)).toBeInTheDocument();
  });

  it("does not render action for GREEN cards", () => {
    render(
      <FeedbackCard
        reportId={SAMPLE_REPORT.id}
        question={QUESTIONS.find((question) => question.id === "u1")!}
        answer={SAMPLE_REPORT.answers.u1}
        evaluation={SAMPLE_REPORT.aiFeedback.u1}
      />,
    );

    expect(screen.queryByText(/Next step:/i)).not.toBeInTheDocument();
  });
});
