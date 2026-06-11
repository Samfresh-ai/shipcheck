import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WizardShell } from "@/components/wizard/WizardShell";
import { QUESTIONS } from "@/src/lib/questions";

export const metadata: Metadata = {
  title: "Product Check",
  description: "Answer one sharp product readiness question at a time.",
};

export default async function WizardStepPage({ params }: { params: Promise<{ step: string }> }) {
  const { step: stepParam } = await params;
  const isStepNumber = /^-?\d+$/.test(stepParam);
  const step = Number.parseInt(stepParam, 10);

  if (!isStepNumber || Number.isNaN(step) || step < 0 || step >= QUESTIONS.length) {
    redirect("/check");
  }

  return <WizardShell step={step} />;
}
