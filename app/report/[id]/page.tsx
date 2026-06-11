import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { FeedbackCard } from "@/components/report/FeedbackCard";
import { OverallInsight } from "@/components/report/OverallInsight";
import { ReportHeader } from "@/components/report/ReportHeader";
import { SectionScoreBar } from "@/components/report/SectionScoreBar";
import { QUESTIONS } from "@/src/lib/questions";
import { getPublicReport } from "@/src/lib/supabase";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const report = await getPublicReport(id);
  return {
    title: report ? `${report.projectName} Report` : "Report",
    description: report
      ? `ShipCheck readiness report for ${report.projectName}: ${report.overallScore}/100.`
      : "ShipCheck public readiness report.",
  };
}

const rank = { RED: 0, AMBER: 1, GREEN: 2 };

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getPublicReport(id);
  if (!report) notFound();

  const cards = Object.entries(report.aiFeedback)
    .map(([questionId, evaluation]) => {
      const question = QUESTIONS.find((item) => item.id === questionId);
      return question ? { question, evaluation } : null;
    })
    .filter(Boolean)
    .sort((a, b) => rank[a!.evaluation.tier] - rank[b!.evaluation.tier] || a!.question.index - b!.question.index);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <ReportHeader report={report} />
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-6">
          <OverallInsight insight={report.overallInsight} />
          <section className="grid gap-4">
            {cards.map((card) =>
              card ? (
                <FeedbackCard
                  key={card.question.id}
                  reportId={report.id}
                  question={card.question}
                  answer={report.answers[card.question.id]}
                  evaluation={card.evaluation}
                />
              ) : null,
            )}
          </section>
        </div>
        <aside className="h-fit border border-[#ded7ca] bg-white p-5">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#665f54]">Section scores</p>
          <div className="mt-5">
            <SectionScoreBar scores={report.sectionScores} />
          </div>
          <div className="mt-8">
            <ButtonLink href="/check" variant="primary" className="w-full">
              Run ShipCheck on your project -&gt;
            </ButtonLink>
          </div>
        </aside>
      </div>
    </div>
  );
}
