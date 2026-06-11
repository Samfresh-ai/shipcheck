"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ProgressBar } from "@/components/wizard/ProgressBar";
import { QuestionCard } from "@/components/wizard/QuestionCard";
import { SectionLoadingCard } from "@/components/wizard/SectionLoadingCard";
import { SectionTransition } from "@/components/wizard/SectionTransition";
import { answerLimitLabel, MAX_ANSWER_CHARACTERS, MIN_ANSWER_CHARACTERS } from "@/src/lib/answer-limits";
import { getStoredSessionId, track } from "@/src/lib/analytics";
import { QUESTIONS, SECTION_ORDER, getQuestionByIndex, type ProjectContext, type SectionId } from "@/src/lib/questions";
import type { SectionEvaluations, ScoreTier } from "@/src/lib/scoring";

type LoadingState = {
  activeSections: Partial<Record<SectionId, true>>;
  completed: Partial<Record<SectionId, SectionEvaluations>>;
  error?: string;
  final?: { reportId: string; overallScore: number; tier: ScoreTier };
};

function storedProjectContext(): ProjectContext | null {
  if (typeof window === "undefined") return null;

  const storedContext = window.localStorage.getItem("shipcheck_context");
  if (!storedContext) return null;

  try {
    return JSON.parse(storedContext) as ProjectContext;
  } catch {
    return null;
  }
}

function storedWizardAnswers(): Record<string, string> {
  if (typeof window === "undefined") return {};

  const storedAnswers = window.localStorage.getItem("shipcheck_answers");
  if (!storedAnswers) return {};

  try {
    return JSON.parse(storedAnswers) as Record<string, string>;
  } catch {
    return {};
  }
}

export function WizardShell({ step }: { step: number }) {
  const router = useRouter();
  const question = getQuestionByIndex(step);
  const [context] = useState<ProjectContext | null>(storedProjectContext);
  const [answers, setAnswers] = useState<Record<string, string>>(storedWizardAnswers);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState<LoadingState>({ activeSections: {}, completed: {} });

  useEffect(() => {
    if (!context) {
      router.replace("/check");
    }
  }, [context, router]);

  useEffect(() => {
    if (step === 0 && context) {
      track("wizard_started", { category: context.category });
    }
  }, [context, step]);

  useEffect(() => {
    function beforeUnload() {
      if (!question) return;
      const sessionId = getStoredSessionId();
      if (!sessionId) return;
      track("wizard_dropoff", {
        questionIndex: question.index,
        sectionId: question.sectionId,
        eventType: "exit",
      });
      navigator.sendBeacon(
        "/api/dropoff",
        new Blob(
          [
            JSON.stringify({
              sessionId,
              questionIndex: question.index,
              sectionId: question.sectionId,
              eventType: "exit",
            }),
          ],
          { type: "application/json" },
        ),
      );
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [question]);

  if (!question || !context) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-4xl items-center justify-center px-5">
        <LoadingSpinner />
      </div>
    );
  }

  const activeQuestion = question;
  const activeContext = context;
  const answer = answers[activeQuestion.id] ?? "";

  function setAnswer(value: string) {
    const next = { ...answers, [activeQuestion.id]: value };
    setAnswers(next);
    window.localStorage.setItem("shipcheck_answers", JSON.stringify(next));
    setError("");
  }

  function sectionCompletedWhenMovingNext() {
    const nextQuestion = QUESTIONS[step + 1];
    return nextQuestion && nextQuestion.sectionId !== activeQuestion.sectionId;
  }

  function oversizedSavedAnswer() {
    return QUESTIONS.find((item) => (answers[item.id] ?? "").trim().length > MAX_ANSWER_CHARACTERS);
  }

  async function goBack() {
    const sessionId = getStoredSessionId();
    if (sessionId) {
      track("wizard_dropoff", {
        questionIndex: activeQuestion.index,
        sectionId: activeQuestion.sectionId,
        eventType: "back",
      });
      fetch("/api/dropoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, questionIndex: activeQuestion.index, sectionId: activeQuestion.sectionId, eventType: "back" }),
      }).catch(() => undefined);
    }
    router.push(step === 0 ? "/check" : `/check/${step - 1}`);
  }

  async function submitReport() {
    const sessionId = getStoredSessionId();
    if (!sessionId) {
      setError("Session is still starting. Try again in a second.");
      return;
    }

    const oversizedAnswer = oversizedSavedAnswer();
    if (oversizedAnswer) {
      setError(`Question ${oversizedAnswer.index + 1} is too long. Keep it under ${answerLimitLabel()} characters.`);
      router.push(`/check/${oversizedAnswer.index}`);
      return;
    }

    setIsSubmitting(true);
    setLoading({ activeSections: {}, completed: {} });
    const startedAt = Date.now();

    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        projectName: activeContext.productName,
        projectUrl: activeContext.productUrl,
        projectContext: activeContext,
        answers,
      }),
    });

    const reader = response.body?.getReader();
    if (!reader) {
      setLoading((current) => ({ ...current, error: "No streaming response received." }));
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let reachedTerminalEvent = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() ?? "";

      for (const chunk of chunks) {
        const line = chunk.split("\n").find((item) => item.startsWith("data: "));
        if (!line) continue;
        const event = JSON.parse(line.slice(6));

        if (event.type === "section_start") {
          setLoading((current) => ({
            ...current,
            activeSections: { ...current.activeSections, [event.sectionId]: true },
          }));
        }
        if (event.type === "section_complete") {
          setLoading((current) => ({
            ...current,
            activeSections: Object.fromEntries(
              Object.entries(current.activeSections).filter(([sectionId]) => sectionId !== event.sectionId),
            ) as Partial<Record<SectionId, true>>,
            completed: { ...current.completed, [event.sectionId]: event.evaluations },
          }));
        }
        if (event.type === "report_complete") {
          reachedTerminalEvent = true;
          track("wizard_completed", {
            totalTimeMs: Date.now() - startedAt,
            overallScore: event.overallScore,
            tier: event.tier,
          });
          setLoading((current) => ({
            ...current,
            final: { reportId: event.reportId, overallScore: event.overallScore, tier: event.tier },
          }));
          window.localStorage.removeItem("shipcheck_answers");
          router.push(`/report/${event.reportId}`);
        }
        if (event.type === "error") {
          reachedTerminalEvent = true;
          track("report_generation_failed", {
            errorType: "report_generation_failed",
            category: activeContext.category,
            stage: activeContext.stage,
            questionsAnswered: Object.keys(answers).length,
          });
          setLoading((current) => ({ ...current, error: event.message }));
        }
      }
    }

    if (!reachedTerminalEvent) {
      track("report_generation_failed", {
        errorType: "report_stream_incomplete",
        category: activeContext.category,
        stage: activeContext.stage,
        questionsAnswered: Object.keys(answers).length,
      });
      setLoading((current) => ({
        ...current,
        activeSections: {},
        error: "Report generation stopped before completion. Try again with the same answers.",
      }));
    }
  }

  async function goNext() {
    if (answer.trim().length < MIN_ANSWER_CHARACTERS) {
      setError(`Answer with at least ${MIN_ANSWER_CHARACTERS} characters before moving on.`);
      return;
    }

    if (answer.trim().length > MAX_ANSWER_CHARACTERS) {
      setError(`Keep this answer under ${answerLimitLabel()} characters before moving on.`);
      return;
    }

    if (sectionCompletedWhenMovingNext()) {
      track("section_completed", { sectionId: activeQuestion.sectionId });
    }

    if (step === QUESTIONS.length - 1) {
      await submitReport();
      return;
    }

    router.push(`/check/${step + 1}`);
  }

  if (isSubmitting) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-10">
        <div className="mb-8 border-b border-[#ded7ca] pb-6">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Evaluating your product</p>
          <h1 className="mt-3 text-4xl font-semibold">This is the honest part.</h1>
          <p className="mt-3 text-[#665f54]">Section results appear as they finish. No account required.</p>
        </div>
        <div className="grid gap-4">
          {SECTION_ORDER.map((sectionId) => (
            <SectionLoadingCard
              key={sectionId}
              sectionId={sectionId}
              status={loading.completed[sectionId] ? "done" : loading.activeSections[sectionId] ? "loading" : "idle"}
              evaluations={loading.completed[sectionId]}
            />
          ))}
        </div>
        {loading.error ? <p className="mt-5 border border-tier-red bg-tier-red-bg p-3 text-tier-red">{loading.error}</p> : null}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <div className="mb-6">
        <ProgressBar currentStep={step} />
      </div>
      {activeQuestion.index === 0 || QUESTIONS[activeQuestion.index - 1]?.sectionId !== activeQuestion.sectionId ? (
        <div className="mb-5">
          <SectionTransition sectionId={activeQuestion.sectionId} />
        </div>
      ) : null}
      <QuestionCard question={activeQuestion} answer={answer} onAnswer={setAnswer} />
      {error ? <p className="mt-4 border border-tier-red bg-tier-red-bg px-3 py-2 text-sm text-tier-red">{error}</p> : null}
      <div className="mt-6 flex items-center justify-between gap-4">
        <Button type="button" variant="secondary" onClick={goBack}>
          Back
        </Button>
        <Button type="button" onClick={goNext}>
          {step === QUESTIONS.length - 1 ? "Submit for review" : "Next"}
        </Button>
      </div>
    </div>
  );
}
