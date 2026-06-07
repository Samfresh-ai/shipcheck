import { TierBadge } from "@/components/ui/TierBadge";
import type { SectionId } from "@/src/lib/questions";
import type { SectionEvaluations } from "@/src/lib/scoring";

const loadingMessages: Record<SectionId, string> = {
  user: "Evaluating your user clarity...",
  problem: "Checking your problem evidence...",
  solution: "Assessing your solution focus...",
  distribution: "Reviewing your distribution plan...",
  metrics: "Computing your score...",
};

export function SectionLoadingCard({
  sectionId,
  status,
  evaluations,
}: {
  sectionId: SectionId;
  status: "idle" | "loading" | "done";
  evaluations?: SectionEvaluations;
}) {
  return (
    <div className="border border-[#ded7ca] bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-sm font-semibold uppercase tracking-[0.12em]">{sectionId}</p>
        <span className="font-mono text-xs uppercase text-[#665f54]">{status}</span>
      </div>
      {status === "loading" ? (
        <div className="mt-4 animate-pulse">
          <p className="text-sm text-[#665f54]">{loadingMessages[sectionId]}</p>
          <div className="mt-4 h-20 bg-[#f4efe6]" />
        </div>
      ) : null}
      {status === "done" && evaluations ? (
        <div className="mt-4 grid gap-3">
          {Object.entries(evaluations).map(([questionId, evaluation]) => (
            <div key={questionId} className="flex items-start justify-between gap-4 border-t border-[#eee7dc] pt-3">
              <p className="text-sm font-semibold">{questionId}</p>
              <TierBadge tier={evaluation.tier} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
