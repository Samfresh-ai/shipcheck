"use client";

import { TextareaHTMLAttributes, useEffect, useRef } from "react";

export function Textarea({ className = "", value, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = ref.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);

  const length = typeof value === "string" ? value.length : 0;
  const maxLength = typeof props.maxLength === "number" ? props.maxLength : undefined;
  const isAtLimit = maxLength !== undefined && length >= maxLength;
  const counterLabel = maxLength ? `${length} / ${maxLength.toLocaleString("en-US")} chars` : `${length} chars`;

  return (
    <div>
      <textarea
        ref={ref}
        value={value}
        className={`min-h-40 w-full resize-none border border-[#cfc7b8] bg-white px-4 py-3 text-base leading-7 text-ink outline-none transition placeholder:text-[#938a7d] focus:border-brand-600 focus:ring-2 focus:ring-brand-100 ${className}`}
        {...props}
      />
      <div className={`mt-2 text-right font-mono text-xs ${isAtLimit ? "text-tier-red" : "text-[#71695e]"}`}>{counterLabel}</div>
    </div>
  );
}
