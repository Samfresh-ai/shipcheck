"use client";

import { useState } from "react";
import { TierBadge } from "@/components/ui/TierBadge";
import { track } from "@/src/lib/analytics";
import type { Question } from "@/src/lib/questions";
import type { QuestionEvaluation } from "@/src/lib/scoring";

const border = {
  RED: "border-l-tier-red",
  AMBER: "border-l-tier-amber",
  GREEN: "border-l-tier-green",
};

export function FeedbackCard({
  reportId,
  question,
  answer,
  evaluation,
}: {
  reportId: string;
  question: Question;
  answer: string;
  evaluation: QuestionEvaluation;
}) {
  const [expanded, setExpanded] = useState(false);

  async function react(reaction: "helpful" | "not_helpful") {
    track("feedback_reaction", { reportId, questionId: question.id, reaction, tier: evaluation.tier });
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, questionId: question.id, reaction }),
    }).catch(() => undefined);
  }

  return (
    <article className={`border border-l-[3px] ${border[evaluation.tier]} border-[#ded7ca] bg-white p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[#665f54]">Question {question.index + 1}</p>
          <h2 className="mt-2 text-xl font-semibold leading-7">{question.question}</h2>
        </div>
        <TierBadge tier={evaluation.tier} />
      </div>
      <div className="mt-4 border-t border-[#eee7dc] pt-4">
        <p className={`text-sm leading-6 text-[#4f473d] ${expanded ? "" : "line-clamp-4"}`}>{answer || "No answer recorded."}</p>
        {answer.length > 220 ? (
          <button type="button" onClick={() => setExpanded((value) => !value)} className="mt-2 text-sm font-semibold underline">
            {expanded ? "Show less" : "Show more"}
          </button>
        ) : null}
      </div>
      <p className="mt-5 text-base leading-7">{evaluation.feedback}</p>
      {evaluation.tier === "RED" && evaluation.action ? (
        <div className="mt-4 border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-800">
          <span className="text-xs font-semibold uppercase tracking-wide text-red-700">Next step: </span>
          {evaluation.action}
        </div>
      ) : null}
      <div className="mt-5 flex gap-3">
        <button type="button" onClick={() => react("helpful")} className="border border-[#cfc7b8] px-3 py-2 text-sm hover:bg-[#f4efe6]">
          Helpful
        </button>
        <button type="button" onClick={() => react("not_helpful")} className="border border-[#cfc7b8] px-3 py-2 text-sm hover:bg-[#f4efe6]">
          Not helpful
        </button>
      </div>
    </article>
  );
}
