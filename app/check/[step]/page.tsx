import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WizardShell } from "@/components/wizard/WizardShell";
import { QUESTIONS } from "@/src/lib/questions";

export const metadata: Metadata = {
  title: "Product Check",
  description: "Answer one sharp product readiness question at a time.",
};

export default function WizardStepPage({ params }: { params: { step: string } }) {
  const isStepNumber = /^-?\d+$/.test(params.step);
  const step = Number.parseInt(params.step, 10);

  if (!isStepNumber || Number.isNaN(step) || step < 0 || step >= QUESTIONS.length) {
    redirect("/check");
  }

  return <WizardShell step={step} />;
}
