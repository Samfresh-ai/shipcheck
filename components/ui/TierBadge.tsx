import type { QuestionTier } from "@/src/lib/questions";
import type { ScoreTier } from "@/src/lib/scoring";

const questionStyles: Record<QuestionTier, string> = {
  RED: "border-tier-red bg-tier-red-bg text-tier-red",
  AMBER: "border-tier-amber bg-tier-amber-bg text-tier-amber",
  GREEN: "border-tier-green bg-tier-green-bg text-tier-green",
};

const scoreStyles: Record<ScoreTier, string> = {
  NOT_READY: "border-tier-red bg-tier-red-bg text-tier-red",
  GETTING_THERE: "border-tier-amber bg-tier-amber-bg text-tier-amber",
  ALMOST: "border-[#d9a400] bg-[#fff8db] text-[#8a6500]",
  SHIP_IT: "border-tier-green bg-tier-green-bg text-tier-green",
};

export function TierBadge({ tier }: { tier: QuestionTier | ScoreTier }) {
  const isQuestionTier = tier === "RED" || tier === "AMBER" || tier === "GREEN";
  const className = isQuestionTier ? questionStyles[tier] : scoreStyles[tier as ScoreTier];

  return (
    <span className={`inline-flex items-center gap-2 border px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-wide ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {tier.replaceAll("_", " ")}
    </span>
  );
}
