import type { Metadata } from "next";
import { SECTIONS } from "@/src/lib/questions";
import { TIER_CONFIG } from "@/src/lib/scoring";

export const metadata: Metadata = {
  title: "Why 20 Questions",
  description: "How ShipCheck scores pre-launch readiness and what Novus data changed.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <h1 className="text-6xl font-semibold leading-none">Why 20 questions?</h1>

      <section className="mt-10 border-t border-[#ded7ca] pt-8">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">The philosophy</h2>
        <div className="mt-5 grid gap-5 text-xl leading-9 text-[#4f473d]">
          <p>
            Most products fail not because of bad execution, but because the builder never pressure-tested the basic product logic before building.
            ShipCheck is a forcing function. It makes the uncomfortable questions unavoidable - in 10 minutes.
          </p>
          <p>
            The 20 questions are opinionated. They do not ask whether you built the feature correctly. They ask whether you thought clearly about who
            it is for, whether the problem is real, and whether anyone will find it. Those are harder questions.
          </p>
        </div>
      </section>

      <section className="mt-10 border-t border-[#ded7ca] pt-8">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">How scoring works</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full border-collapse bg-white text-left">
            <thead>
              <tr className="border-b border-[#ded7ca]">
                <th className="p-3">Section</th>
                <th className="p-3">Weight</th>
                <th className="p-3">What we look for</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(SECTIONS).map(([id, section]) => (
                <tr key={id} className="border-b border-[#eee7dc]">
                  <td className="p-3 font-semibold">{section.label}</td>
                  <td className="p-3 font-mono">{Math.round(section.weight * 100)}%</td>
                  <td className="p-3 text-[#665f54]">{section.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {Object.entries(TIER_CONFIG).map(([tier, config]) => (
            <div key={tier} className="border border-[#ded7ca] bg-white p-4">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em]">{config.label}</p>
              <p className="mt-2 text-sm leading-6 text-[#665f54]">{config.message}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 border-t border-[#ded7ca] pt-8">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">What Novus tells us</h2>
        <p className="mt-5 text-xl leading-9 text-[#4f473d]">
          After launching ShipCheck, Novus showed us where builders actually struggle. 43% of users dropped off at question 12 - the one that asks
          what underlying belief makes your product obviously valuable. We rewrote the subtext twice. Drop-off fell from 43% to 21%. The product
          that measures readiness had to measure its own readiness. That is the point.
        </p>
      </section>

      <section className="mt-10 border-t border-[#ded7ca] pt-8">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Byline</h2>
        <p className="mt-5 text-xl leading-9">
          Built by Samfresh, Abuja, Nigeria. Built for the Mind the Product World Product Day 2026 hackathon.
        </p>
        <p className="mt-3 text-[#665f54]">GitHub link · Hackathon submission link</p>
      </section>
    </div>
  );
}
