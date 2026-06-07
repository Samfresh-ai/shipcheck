"use client";

import { useEffect } from "react";
import { ScoreCircle } from "@/components/report/ScoreCircle";
import { ShareButton } from "@/components/report/ShareButton";
import { TierBadge } from "@/components/ui/TierBadge";
import { TIER_CONFIG } from "@/src/lib/scoring";
import { track } from "@/src/lib/analytics";
import type { ShipReport } from "@/src/lib/report-types";

export function ReportHeader({ report }: { report: ShipReport }) {
  useEffect(() => {
    track("report_viewed", { reportId: report.id, score: report.overallScore, tier: report.scoreTier });
  }, [report.id, report.overallScore, report.scoreTier]);

  return (
    <header className="grid gap-8 border-b border-[#ded7ca] pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
      <div>
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Readiness report</p>
        <h1 className="mt-4 text-5xl font-semibold leading-none sm:text-7xl">{report.projectName}</h1>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <TierBadge tier={report.scoreTier} />
          <p className="text-sm text-[#665f54]">{TIER_CONFIG[report.scoreTier].message}</p>
        </div>
        <div className="mt-7">
          <ShareButton
            reportId={report.id}
            score={report.overallScore}
            tier={report.scoreTier}
            projectCategory={report.projectContext.category}
            projectStage={report.projectContext.stage}
          />
        </div>
      </div>
      <ScoreCircle score={report.overallScore} />
    </header>
  );
}
