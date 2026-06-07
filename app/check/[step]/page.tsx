import type { Metadata } from "next";
import { WizardShell } from "@/components/wizard/WizardShell";

export const metadata: Metadata = {
  title: "Product Check",
  description: "Answer one sharp product readiness question at a time.",
};

export default function WizardStepPage({ params }: { params: { step: string } }) {
  const step = Number(params.step);
  return <WizardShell step={Number.isFinite(step) ? step : 0} />;
}
