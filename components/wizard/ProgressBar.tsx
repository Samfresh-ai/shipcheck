import { QUESTIONS } from "@/src/lib/questions";

const colors = {
  user: "bg-brand-600",
  problem: "bg-tier-red",
  solution: "bg-ink",
  distribution: "bg-tier-amber",
  metrics: "bg-tier-green",
};

export function ProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <div aria-label="Question progress" className="grid grid-cols-20 gap-1">
      {QUESTIONS.map((question) => (
        <div
          key={question.id}
          className={`h-2 ${colors[question.sectionId]} ${question.index <= currentStep ? "opacity-100" : "opacity-20"}`}
        />
      ))}
    </div>
  );
}
