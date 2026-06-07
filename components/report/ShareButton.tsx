"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { track } from "@/src/lib/analytics";

type ShareButtonProps = {
  reportId: string;
  score?: number;
  tier?: string;
  projectCategory?: string;
  projectStage?: string;
};

export function ShareButton({ reportId, score, tier, projectCategory, projectStage }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    track("report_shared", { reportId });
    track("report_shared_with_score", {
      reportId,
      score,
      tier,
      projectCategory,
      projectStage,
    });
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative">
      <Button type="button" variant="secondary" onClick={share}>
        Copy report URL
      </Button>
      {copied ? <span className="absolute -bottom-7 left-0 font-mono text-xs text-tier-green">Copied!</span> : null}
    </div>
  );
}
