"use client";

import { useEffect, useState } from "react";

export function ScoreCircle({ score }: { score: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const started = performance.now();
    const duration = 1500;
    let frame = 0;

    function tick(now: number) {
      const progress = Math.min(1, (now - started) / duration);
      setDisplay(Math.round(score * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div className="flex h-36 w-36 items-center justify-center border-4 border-ink bg-white sm:h-44 sm:w-44">
      <span className="text-6xl font-semibold tabular-nums sm:text-7xl">{display}</span>
    </div>
  );
}
