"use client";

import {
  CAGE_ZONE_LABEL,
  deriveSuggestions,
  deriveTendencies,
  zoneDistribution,
  type ActionStat,
  type CageZone,
  type DnaSplit,
  type TendencyTone,
} from "@/lib/fight-stats";

const TONE_COLOR: Record<TendencyTone, string> = {
  weapon: "#8A63E8",
  success: "#3EE06B",
  zone: "var(--ta-cyan)",
  setup: "#9D7BFA",
  warning: "var(--ta-pink)",
};

/**
 * §3 Tendenzen + §4 Vorschläge + §5 Käfig-Heatmap.
 *
 * Rein abgeleitete Read-Ansicht: berechnet sich vollständig aus Split + Stats.
 * Rendert nichts, wenn keine Datengrundlage vorhanden ist.
 */
export default function FightInsights({
  split,
  stats,
}: {
  split: DnaSplit | null | undefined;
  stats: ActionStat[];
}) {
  const tendencies = deriveTendencies(stats);
  const suggestions = deriveSuggestions(split, stats);
  const zones = zoneDistribution(stats);
  const zoneTotal = zones.center + zones.open + zones.cage;

  if (tendencies.length === 0 && suggestions.length === 0 && zoneTotal === 0)
    return null;

  return (
    <div
      className="rounded-2xl p-4 sm:p-5"
      style={{
        background:
          "radial-gradient(360px 180px at 0% 0%, rgba(35,196,206,0.08), transparent 60%), var(--ink-2)",
        border: "1px solid var(--ink-4)",
      }}
    >
      <div
        className="font-mono-ta mb-3 text-[10px] font-bold uppercase"
        style={{ letterSpacing: "0.2em", color: "var(--ta-cyan)" }}
      >
        Auto-Insights
      </div>

      {/* §3 Tendenzen */}
      {tendencies.length > 0 && (
        <div className="flex flex-col gap-2">
          {tendencies.map((t) => (
            <div key={t.id} className="flex items-start gap-2">
              <span
                className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ background: TONE_COLOR[t.tone] }}
              />
              <span className="text-sm leading-relaxed" style={{ color: "var(--fg-1)" }}>
                {t.text}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* §5 Käfig-Heatmap */}
      {zoneTotal > 0 && (
        <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-4">
          <CageHeatmap zones={zones} total={zoneTotal} />
          <div className="flex flex-col gap-1.5">
            <div
              className="font-mono-ta text-[10px] uppercase"
              style={{ letterSpacing: "0.15em", color: "var(--fg-4)" }}
            >
              Wo passiert die Aktion
            </div>
            {(["cage", "open", "center"] as CageZone[]).map((z) => (
              <div key={z} className="flex items-center gap-2">
                <span
                  className="font-mono-ta w-9 text-right text-xs"
                  style={{ color: "var(--ta-pink)" }}
                >
                  {Math.round((zones[z] / zoneTotal) * 100)}%
                </span>
                <span className="text-xs" style={{ color: "var(--fg-2)" }}>
                  {CAGE_ZONE_LABEL[z]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* §4 Gameplan- & Drill-Vorschläge */}
      {suggestions.length > 0 && (
        <div className="mt-4 border-t pt-3" style={{ borderColor: "var(--ink-4)" }}>
          <div
            className="font-mono-ta mb-2 text-[10px] uppercase"
            style={{ letterSpacing: "0.15em", color: "var(--fg-4)" }}
          >
            Vorschläge · frei anpassbar
          </div>
          <div className="flex flex-col gap-2">
            {suggestions.map((s) => (
              <div key={s.id} className="flex items-start gap-2">
                <span
                  className="font-mono-ta mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
                  style={{
                    letterSpacing: "0.08em",
                    background: s.kind === "drill" ? "rgba(35,196,206,0.12)" : "rgba(255,79,168,0.12)",
                    border: `1px solid ${s.kind === "drill" ? "var(--ta-cyan)" : "var(--ta-pink)"}`,
                    color: s.kind === "drill" ? "var(--ta-cyan)" : "var(--ta-pink)",
                  }}
                >
                  {s.kind === "drill" ? "Drill" : "Plan"}
                </span>
                <span className="text-sm leading-relaxed" style={{ color: "var(--fg-1)" }}>
                  {s.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── §5 Käfig-Heatmap (SVG) ──────────────────────────────────────────────────

/** Punkte eines regelmäßigen Octagons mit Radius r um den Mittelpunkt (50,50). */
function octagon(r: number): string {
  const pts: string[] = [];
  for (let k = 0; k < 8; k++) {
    const a = ((22.5 + k * 45) * Math.PI) / 180;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

function CageHeatmap({
  zones,
  total,
}: {
  zones: Record<CageZone, number>;
  total: number;
}) {
  // Anteil → Deckkraft (0.12 Grundton + bis 0.65 nach Anteil).
  const alpha = (z: CageZone) => 0.12 + 0.65 * (total > 0 ? zones[z] / total : 0);
  const pink = "255,79,168";

  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 100 100"
      role="img"
      aria-label="Käfig-Heatmap: Verteilung der Aktionen nach Zone"
    >
      {/* Cage-Ring (äußerste Zone) */}
      <polygon points={octagon(44)} fill={`rgba(${pink},${alpha("cage")})`} />
      {/* Open-Ring */}
      <polygon points={octagon(30)} fill={`rgba(${pink},${alpha("open")})`} />
      {/* Center */}
      <circle cx="50" cy="50" r="15" fill={`rgba(${pink},${alpha("center")})`} />
      {/* Konturen */}
      <polygon
        points={octagon(44)}
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1"
      />
      <polygon
        points={octagon(30)}
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="0.75"
      />
      <circle cx="50" cy="50" r="15" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.75" />
    </svg>
  );
}
