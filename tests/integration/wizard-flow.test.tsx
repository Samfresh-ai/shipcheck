import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectSetupForm } from "@/components/setup/ProjectSetupForm";
import { QuestionCard } from "@/components/wizard/QuestionCard";
import { QUESTIONS } from "@/src/lib/questions";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

describe("wizard flow pieces", () => {
  beforeEach(() => {
    window.localStorage.clear();
    push.mockClear();
  });

  it("saves project context and advances to question 0", () => {
    render(<ProjectSetupForm />);
    fireEvent.change(screen.getByLabelText(/Product name/i), { target: { value: "ShipCheck" } });
    fireEvent.change(screen.getByLabelText(/What does it do/i), { target: { value: "A readiness check for product builders." } });
    fireEvent.click(screen.getByRole("button", { name: /Start the check/i }));

    expect(JSON.parse(window.localStorage.getItem("shipcheck_context") || "{}").productName).toBe("ShipCheck");
    expect(push).toHaveBeenCalledWith("/check/0");
  });

  it("renders question 0 and updates answer state", () => {
    let answer = "";
    render(<QuestionCard question={QUESTIONS[0]} answer={answer} onAnswer={(value) => (answer = value)} />);
    fireEvent.change(screen.getByPlaceholderText(/solo founder/i), { target: { value: "A solo builder preparing launch." } });
    expect(answer).toBe("A solo builder preparing launch.");
  });
});
