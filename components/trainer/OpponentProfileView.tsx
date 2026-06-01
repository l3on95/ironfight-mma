"use client";

import {
  FIGHTER_STANCE_LABEL,
  FIGHT_STYLE_LABEL,
  type FighterStance,
  type FightStyle,
} from "@/lib/fight-camp";
import type { GegnerDnaAnswers } from "@/lib/gegner-dna";
import GegnerDnaAccordion from "./GegnerDnaAccordion";

export interface OpponentView {
  name: string;
  style: FightStyle;
  stance: FighterStance;
  heightCm?: number | null;
  weightKg?: number | null;
  reachCm?: number | null;
  strengths?: string[];
  weaknesses?: string[];
  favoriteAttacks?: string[];
  notes?: string | null;
  dna?: GegnerDnaAnswers;
}

/**
 * Read-only Gegnerbericht: Gegnerprofil-Zusammenfassung + Gegner-DNA in der
 * Profilansicht (nur beantwortete Fragen). Wird im Bibliotheks-Profil und in
 * der Wettkampf-Detailansicht (Snapshot) genutzt.
 */
export default function OpponentProfileView({
  opponent,
  showBasics = true,
}: {
  opponent: OpponentView;
  /** Grunddaten-Kopf anzeigen (in der Wettkampf-Ansicht oft schon vorhanden). */
  showBasics?: boolean;
}) {
  const measures = [
    opponent.heightCm ? `${opponent.heightCm} cm` : null,
    opponent.weightKg ? `${opponent.weightKg} kg` : null,
    opponent.reachCm ? `Reach ${opponent.reachCm} cm` : null,
  ].filter(Boolean);

  const strengths = opponent.strengths ?? [];
  const weaknesses = opponent.weaknesses ?? [];
  const favorites = opponent.favoriteAttacks ?? [];

  return (
    <div className="flex flex-col gap-4">
      {showBasics && (
        <div
          className="rounded-2xl p-4 sm:p-5"
          style={{
            background:
              "radial-gradient(400px 200px at 100% 0%, rgba(255,45,120,0.12), transparent 60%), linear-gradient(160deg, var(--ink-3), var(--ink-2))",
            border: "1px solid rgba(255,45,120,0.3)",
          }}
        >
          <div
            className="font-mono-ta text-[9px] uppercase"
            style={{ letterSpacing: "0.2em", color: "var(--ta-pink)" }}
          >
            Gegner
          </div>
          <div
            className="font-display-ta mt-1 font-black uppercase"
            style={{ fontSize: "20px", letterSpacing: "0.03em" }}
          >
            {opponent.name}
          </div>
          <div
            className="font-mono-ta mt-1 text-[11px]"
            style={{ color: "var(--fg-3)" }}
          >
            {FIGHT_STYLE_LABEL[opponent.style]} ·{" "}
            {FIGHTER_STANCE_LABEL[opponent.stance]}
          </div>
          {measures.length > 0 && (
            <div
              className="font-mono-ta mt-1 text-[11px]"
              style={{ color: "var(--fg-4)" }}
            >
              {measures.join(" · ")}
            </div>
          )}

          {(strengths.length > 0 ||
            weaknesses.length > 0 ||
            favorites.length > 0 ||
            opponent.notes) && (
            <div className="mt-3 flex flex-col gap-1 text-xs">
              {strengths.length > 0 && (
                <div>
                  <span style={{ color: "var(--ta-cyan)" }}>+ </span>
                  <span style={{ color: "var(--fg-2)" }}>
                    {strengths.join(", ")}
                  </span>
                </div>
              )}
              {weaknesses.length > 0 && (
                <div>
                  <span style={{ color: "var(--ta-pink)" }}>− </span>
                  <span style={{ color: "var(--fg-2)" }}>
                    {weaknesses.join(", ")}
                  </span>
                </div>
              )}
              {favorites.length > 0 && (
                <div>
                  <span style={{ color: "#FBBF24" }}>★ </span>
                  <span style={{ color: "var(--fg-2)" }}>
                    {favorites.join(", ")}
                  </span>
                </div>
              )}
              {opponent.notes && (
                <div
                  className="mt-1 italic"
                  style={{ color: "var(--fg-4)", fontSize: "11px" }}
                >
                  &bdquo;{opponent.notes}&ldquo;
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <GegnerDnaAccordion answers={opponent.dna ?? {}} mode="view" />
    </div>
  );
}
