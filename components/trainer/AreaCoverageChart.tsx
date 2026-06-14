"use client";

import type { AreaScore } from "@/lib/fight-camp-analysis";

/**
 * Horizontaler Balken-Chart der Bereichs-Abdeckung.
 * Stärken in Cyan, Schwächen in Pink — visualisiert auf einen Blick.
 */
export default function AreaCoverageChart({
  scores,
  highlightWeak = false,
  highlightAreas,
}: {
  scores: AreaScore[];
  highlightWeak?: boolean;
  highlightAreas?: Set<string>;
}) {
  const max = Math.max(0.0001, ...scores.map((s) => s.coverage));

  return (
    <div className="flex flex-col gap-1.5">
      {scores.map((s) => {
        const pct = (s.coverage / max) * 100;
        const isWeak = s.coverage < 0.25;
        const isHighlight = highlightAreas?.has(s.area) ?? false;
        const barColor = isHighlight
          ? "var(--ta-pink)"
          : isWeak && highlightWeak
            ? "rgba(255,79,168,0.5)"
            : "var(--ta-cyan)";
        return (
          <div
            key={s.area}
            className="flex items-center gap-2 rounded-md px-2 py-1"
            style={{
              background: isHighlight ? "rgba(255,79,168,0.06)" : "transparent",
              border: isHighlight
                ? "1px solid rgba(255,79,168,0.25)"
                : "1px solid transparent",
            }}
          >
            <div
              className="font-mono-ta w-28 truncate text-[10px] uppercase"
              style={{
                letterSpacing: "0.12em",
                color: isHighlight ? "var(--ta-pink)" : "var(--fg-3)",
              }}
            >
              {s.label}
            </div>
            <div
              className="flex-1 overflow-hidden rounded-full"
              style={{
                height: "8px",
                background: "var(--ink-3)",
                border: "1px solid var(--ink-5)",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.max(2, pct)}%`,
                  background: barColor,
                  boxShadow: `0 0 8px ${barColor}`,
                  transition: "width 0.4s",
                }}
              />
            </div>
            <div
              className="font-mono-ta w-12 text-right text-[10px]"
              style={{
                letterSpacing: "0.08em",
                color: isHighlight ? "var(--ta-pink)" : "var(--fg-4)",
              }}
            >
              {s.workoutCount} · {s.practicedTechniqueCount}
            </div>
          </div>
        );
      })}
      <div
        className="font-mono-ta mt-1 px-2 text-[9px]"
        style={{ letterSpacing: "0.12em", color: "var(--fg-4)" }}
      >
        Workouts · Techniken (geübt)
      </div>
    </div>
  );
}
