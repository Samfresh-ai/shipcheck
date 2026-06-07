import { SECTIONS, SECTION_ORDER, type SectionId } from "@/src/lib/questions";

export function SectionScoreBar({ scores }: { scores: Record<SectionId, number> }) {
  return (
    <section className="grid gap-3">
      {SECTION_ORDER.map((sectionId) => {
        const score = Math.round(scores[sectionId] ?? 0);
        return (
          <div key={sectionId} className="grid gap-2 sm:grid-cols-[160px_1fr_48px] sm:items-center">
            <p className="font-semibold">{SECTIONS[sectionId].label}</p>
            <div className="h-3 border border-[#cfc7b8] bg-white">
              <div className="h-full bg-ink" style={{ width: `${score}%` }} />
            </div>
            <p className="font-mono text-sm tabular-nums">{score}</p>
          </div>
        );
      })}
    </section>
  );
}
