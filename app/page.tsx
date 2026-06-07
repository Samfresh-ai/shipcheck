import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { SAMPLE_REPORT_ID } from "@/src/lib/sample-report";

export const metadata: Metadata = {
  title: "Ship with intention",
  description: "20 questions, 10 minutes, and honest AI feedback before you ship.",
};

export default function Home() {
  const sampleId = process.env.SEED_REPORT_ID || SAMPLE_REPORT_ID;

  return (
    <div>
      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-brand-600">Pre-launch readiness</p>
          <h1 className="mt-5 max-w-4xl text-6xl font-semibold leading-[0.95] tracking-normal text-ink sm:text-7xl lg:text-8xl">
            Ship with intention. Not just enthusiasm.
          </h1>
          <p className="mt-7 max-w-2xl text-xl leading-9 text-[#665f54]">
            20 questions. 10 minutes. An honest score of your product&apos;s readiness - with AI feedback on every weak answer.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/check">Check your product -&gt;</ButtonLink>
            <ButtonLink href={`/report/${sampleId}`} variant="secondary">
              See a sample report -&gt;
            </ButtonLink>
          </div>
          <a href={`/report/${sampleId}`} className="mt-5 inline-block text-sm font-semibold underline">
            Read the ShipCheck-evaluating-ShipCheck report
          </a>
        </div>
        <div className="border border-[#ded7ca] bg-white p-5 shadow-ledger">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#665f54]">How it works</p>
          <ol className="mt-5 grid gap-5">
            {[
              "Tell us about your product in 30 seconds.",
              "Answer 20 sharp questions across 5 areas of product thinking.",
              "Get specific feedback and a shareable readiness score.",
            ].map((item, index) => (
              <li key={item} className="grid grid-cols-[42px_1fr] gap-4 border-t border-[#eee7dc] pt-4">
                <span className="font-mono text-2xl font-semibold">{index + 1}</span>
                <span className="text-lg leading-7">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-y border-[#ded7ca] bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 lg:grid-cols-[0.8fr_1.2fr]">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-brand-600">
            Built for this hackathon. Tested on itself.
          </p>
          <div>
            <p className="text-3xl font-semibold leading-tight">
              ShipCheck was built for the Mind the Product World Product Day 2026 hackathon. Before submitting, we ran it through itself.
            </p>
            <p className="mt-5 text-lg leading-8 text-[#665f54]">
              Score: 67 - Almost Ready. RED: distribution plan. AMBER: retention strategy. GREEN: user definition and problem clarity.
              The distribution section was the first thing rewritten after seeing the results.
            </p>
            <a href={`/report/${sampleId}`} className="mt-5 inline-block font-semibold underline">
              Read the ShipCheck report -&gt;
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-brand-600">
            What we learned from watching real users
          </p>
          <p className="mt-5 text-2xl font-semibold leading-9">
            Novus showed 43% of users dropped off at question 12 - &quot;What would a user have to believe is true to find your product valuable?&quot;
          </p>
          <p className="mt-4 text-lg leading-8 text-[#665f54]">
            The subtext was too abstract. We rewrote it with a concrete example. Drop-off at that question fell from 43% to 21%.
          </p>
        </div>
        <div className="grid gap-5 border border-[#ded7ca] bg-white p-5">
          <div>
            <div className="mb-2 flex justify-between font-mono text-sm">
              <span>Before</span>
              <span>43%</span>
            </div>
            <div className="h-5 border border-[#cfc7b8]">
              <div className="h-full bg-tier-red" style={{ width: "43%" }} />
            </div>
          </div>
          <div>
            <div className="mb-2 flex justify-between font-mono text-sm">
              <span>After rewrite</span>
              <span>21%</span>
            </div>
            <div className="h-5 border border-[#cfc7b8]">
              <div className="h-full bg-tier-green" style={{ width: "21%" }} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
