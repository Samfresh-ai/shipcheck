export function OverallInsight({ insight }: { insight: string }) {
  return (
    <section className="border-l-4 border-ink bg-white px-5 py-4 shadow-ledger">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#665f54]">Overall insight</p>
      <p className="mt-3 text-xl leading-9 text-ink">{insight}</p>
    </section>
  );
}
