import { SECTIONS, type SectionId } from "@/src/lib/questions";

export function SectionTransition({ sectionId }: { sectionId: SectionId }) {
  const section = SECTIONS[sectionId];

  return (
    <div className="border-l-4 border-ink bg-[#f4efe6] px-4 py-3">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#665f54]">Section</p>
      <p className="mt-1 text-lg font-semibold">{section.label}</p>
      <p className="text-sm text-[#665f54]">{section.description}</p>
    </div>
  );
}
