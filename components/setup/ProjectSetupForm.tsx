"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CATEGORY_LABELS, STAGE_LABELS, type ProductCategory, type ProductStage } from "@/src/lib/questions";
import { track } from "@/src/lib/analytics";

type SetupState = {
  productName: string;
  productUrl: string;
  oneLiner: string;
  category: ProductCategory;
  stage: ProductStage;
};

const defaultState: SetupState = {
  productName: "",
  productUrl: "",
  oneLiner: "",
  category: "developer_tool",
  stage: "building",
};

function storedSetupState(): SetupState {
  if (typeof window === "undefined") return defaultState;

  const stored = window.localStorage.getItem("shipcheck_context");
  if (!stored) return defaultState;

  try {
    return { ...defaultState, ...(JSON.parse(stored) as Partial<SetupState>) };
  } catch {
    return defaultState;
  }
}

export function ProjectSetupForm() {
  const router = useRouter();
  const [state, setState] = useState<SetupState>(storedSetupState);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("shipcheck_context");
      if (!stored) return;
      const previous = JSON.parse(stored) as Partial<SetupState>;
      track("assessment_restarted", {
        previousCategory: previous.category ?? "unknown",
        previousStage: previous.stage ?? "unknown",
        isReturningUser: true,
      });
    } catch {
      // Ignore stale localStorage from older builds.
    }
  }, []);

  function update<K extends keyof SetupState>(key: K, value: SetupState[K]) {
    setState((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!state.productName.trim() || !state.oneLiner.trim()) {
      setError("Product name and one sentence are required.");
      return;
    }

    const context = {
      productName: state.productName.trim(),
      productUrl: state.productUrl.trim() || undefined,
      category: state.category,
      stage: state.stage,
      oneLiner: state.oneLiner.trim(),
    };
    window.localStorage.setItem("shipcheck_context", JSON.stringify(context));
    track("setup_completed", { category: context.category, stage: context.stage });
    router.push("/check/0");
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl border-x border-[#ded7ca] bg-[#fbfaf7] px-5 py-10 sm:px-10">
      <div className="border-b border-[#ded7ca] pb-8">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Before question 1</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-normal text-ink sm:text-5xl">First, tell us about your product.</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-[#665f54]">
          This makes your feedback specific to you - not generic PM advice.
        </p>
      </div>

      <div className="grid gap-6 py-8">
        <label className="grid gap-2">
          <span className="text-sm font-semibold">Product name *</span>
          <input
            maxLength={60}
            value={state.productName}
            onChange={(event) => update("productName", event.target.value)}
            className="border border-[#cfc7b8] bg-white px-4 py-3 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold">Product URL</span>
          <input
            value={state.productUrl}
            onChange={(event) => update("productUrl", event.target.value)}
            placeholder="https://yourproduct.com"
            className="border border-[#cfc7b8] bg-white px-4 py-3 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold">What does it do? *</span>
          <textarea
            maxLength={120}
            value={state.oneLiner}
            onChange={(event) => update("oneLiner", event.target.value)}
            placeholder="e.g. ShipCheck scores a builder's product readiness before they ship."
            className="min-h-28 border border-[#cfc7b8] bg-white px-4 py-3 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          />
          <span className="font-mono text-xs text-[#71695e]">One sentence. No jargon. {state.oneLiner.length}/120</span>
        </label>

        <div className="grid gap-6 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-semibold">Category *</span>
            <select
              value={state.category}
              onChange={(event) => update("category", event.target.value as ProductCategory)}
              className="border border-[#cfc7b8] bg-white px-4 py-3 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            >
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold">Stage *</span>
            <select
              value={state.stage}
              onChange={(event) => update("stage", event.target.value as ProductStage)}
              className="border border-[#cfc7b8] bg-white px-4 py-3 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            >
              {Object.entries(STAGE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error ? <p className="mb-4 border border-tier-red bg-tier-red-bg px-3 py-2 text-sm text-tier-red">{error}</p> : null}
      <Button type="submit">Start the check -&gt;</Button>
    </form>
  );
}
