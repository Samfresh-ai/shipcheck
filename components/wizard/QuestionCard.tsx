"use client";

import { Textarea } from "@/components/ui/Textarea";
import type { Question } from "@/src/lib/questions";
import { track } from "@/src/lib/analytics";

export function QuestionCard({
  question,
  answer,
  onAnswer,
}: {
  question: Question;
  answer: string;
  onAnswer: (value: string) => void;
}) {
  return (
    <section className="border border-[#ded7ca] bg-white p-5 shadow-ledger sm:p-8">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
        Question {question.index + 1} of 20
      </p>
      <h1 className="mt-4 text-3xl font-semibold leading-tight text-ink sm:text-4xl">{question.question}</h1>
      <p className="mt-4 text-lg leading-8 text-[#665f54]">{question.subtext}</p>
      <div className="mt-8">
        <Textarea
          value={answer}
          placeholder={question.placeholder}
          onChange={(event) => onAnswer(event.target.value)}
          onBlur={() =>
            track("question_answered", {
              questionId: question.id,
              sectionId: question.sectionId,
              stepIndex: question.index,
              answerLength: answer.length,
            })
          }
        />
      </div>
    </section>
  );
}
