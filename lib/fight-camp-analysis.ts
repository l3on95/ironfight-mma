/**
 * Fight-Camp-Analyse — Trainings-Historie → Stärken / Schwächen
 *
 * Ziel: Aus echten Schülerdaten (Workouts, Technik-Progress, Library) ableiten,
 *   • welche Kampfbereiche der Schüler oft trainiert
 *   • welche selten trainiert wurden
 *   • welche Techniken er beherrscht / kennt / nie gesehen hat
 *   • und welche Schwerpunkte gegen einen bestimmten Gegnerstil sinnvoll sind.
 *
 * Methodisch bewusst einfach gehalten: Counts + Anteile, keine ML.
 * Methodische Annahmen sind dokumentiert und im UI als Hinweis sichtbar.
 */

import { ALL_TECHNIQUES } from "./techniques";
import {
  TRAINING_AREA_LABEL,
  type Category,
  type TechniqueProgress,
  type TechniqueProgressStatus,
  type TrainingArea,
} from "./types";
import type { WorkoutSession } from "./workouts";
import type { FightStyle, OpponentProfile } from "./fight-camp";

// ─── Analyse-Ergebnis-Typen ────────────────────────────────────────────────

export interface AreaScore {
  area: TrainingArea;
  label: string;
  /** Wie oft wurde dieser Bereich in der App-Historie tangiert (Workouts) */
  workoutCount: number;
  /** Wie viele Techniken im progress geübt wurden */
  practicedTechniqueCount: number;
  /** Wie viele Techniken vom User gemeistert sind (mastered/practiced) */
  masteredTechniqueCount: number;
  /** 0..1 — wie gut der Bereich abgedeckt ist (rel. zu allen Bereichen) */
  coverage: number;
}

export interface CategoryDistribution {
  category: Category;
  workoutCount: number;
  shareOfTotal: number; // 0..1
}

export interface TrainingHistoryAnalysis {
  totalWorkouts: number;
  totalTrainingHours: number;
  weeksTracked: number;
  workoutsPerWeek: number;
  categoryDistribution: CategoryDistribution[];
  areaScores: AreaScore[];
  /** Oben in Coverage */
  strongAreas: AreaScore[];
  /** Unten in Coverage — Kandidaten für Fokus */
  weakAreas: AreaScore[];
  technique: {
    total: number;
    mastered: number;
    practiced: number;
    learned: number;
    notStarted: number;
  };
}

// ─── Analyse aus Workout-Historie ──────────────────────────────────────────

const ALL_AREAS: TrainingArea[] = [
  "stand-up",
  "footwork",
  "punches",
  "kicks",
  "knees",
  "elbows",
  "clinch",
  "takedowns",
  "takedown-defense",
  "ground-control",
  "guard",
  "sweeps",
  "submissions",
  "escapes",
  "transitions",
  "defense",
  "combos",
  "drills",
];

/**
 * Map: techniqueId → trainingAreas (für schnelle Lookup-Joins).
 */
const TECHNIQUE_AREAS = new Map<string, TrainingArea[]>(
  ALL_TECHNIQUES.map((t) => {
    const areas = Array.isArray(t.trainingArea)
      ? t.trainingArea
      : t.trainingArea
        ? [t.trainingArea]
        : [];
    return [t.id, areas];
  }),
);

export function analyzeTrainingHistory(
  workouts: WorkoutSession[],
  progress: TechniqueProgress[],
): TrainingHistoryAnalysis {
  const totalWorkouts = workouts.length;
  const totalSeconds = workouts.reduce(
    (s, w) => s + (w.totalWorkSeconds || 0),
    0,
  );
  const totalTrainingHours = +(totalSeconds / 3600).toFixed(1);

  // Zeitspanne
  const sorted = [...workouts].sort(
    (a, b) => a.completedAt.getTime() - b.completedAt.getTime(),
  );
  const firstDate = sorted[0]?.completedAt;
  const lastDate = sorted[sorted.length - 1]?.completedAt ?? new Date();
  const spanDays = firstDate
    ? Math.max(
        1,
        Math.ceil(
          (lastDate.getTime() - firstDate.getTime()) / (24 * 3600 * 1000),
        ),
      )
    : 1;
  const weeksTracked = Math.max(1, Math.round(spanDays / 7));
  const workoutsPerWeek = +(totalWorkouts / weeksTracked).toFixed(1);

  // Category-Verteilung
  const categoryCount: Record<Category, number> = {
    boxing: 0,
    wrestling: 0,
    bjj: 0,
    "muay-thai": 0,
  };
  for (const w of workouts) {
    if (w.category) categoryCount[w.category]++;
  }
  const categoryDistribution: CategoryDistribution[] = (
    ["boxing", "wrestling", "bjj", "muay-thai"] as Category[]
  )
    .map((c) => ({
      category: c,
      workoutCount: categoryCount[c],
      shareOfTotal: totalWorkouts > 0 ? categoryCount[c] / totalWorkouts : 0,
    }))
    .sort((a, b) => b.workoutCount - a.workoutCount);

  // Area-Scores: für jede Area, zähle Workouts mit Techniken in der Area
  const areaWorkouts: Record<TrainingArea, number> = Object.fromEntries(
    ALL_AREAS.map((a) => [a, 0]),
  ) as Record<TrainingArea, number>;
  const areaPracticedCount: Record<TrainingArea, number> = Object.fromEntries(
    ALL_AREAS.map((a) => [a, 0]),
  ) as Record<TrainingArea, number>;
  const areaMasteredCount: Record<TrainingArea, number> = Object.fromEntries(
    ALL_AREAS.map((a) => [a, 0]),
  ) as Record<TrainingArea, number>;

  for (const w of workouts) {
    const seen = new Set<TrainingArea>();
    for (const techId of w.techniqueIds ?? []) {
      const areas = TECHNIQUE_AREAS.get(techId) ?? [];
      for (const a of areas) {
        if (seen.has(a)) continue;
        seen.add(a);
        areaWorkouts[a]++;
      }
    }
  }

  for (const p of progress) {
    const areas = TECHNIQUE_AREAS.get(p.techniqueId) ?? [];
    for (const a of areas) {
      if (p.status === "practiced" || p.status === "mastered") {
        areaPracticedCount[a]++;
      }
      if (p.status === "mastered") areaMasteredCount[a]++;
    }
  }

  // Coverage normalisieren: max workoutCount = 1.0
  const maxWorkouts = Math.max(
    1,
    ...ALL_AREAS.map((a) => areaWorkouts[a]),
  );

  const areaScores: AreaScore[] = ALL_AREAS.map((a) => ({
    area: a,
    label: TRAINING_AREA_LABEL[a],
    workoutCount: areaWorkouts[a],
    practicedTechniqueCount: areaPracticedCount[a],
    masteredTechniqueCount: areaMasteredCount[a],
    coverage: areaWorkouts[a] / maxWorkouts,
  }));

  // Strong = top 5 mit > 0 Coverage; Weak = unterste 6 mit niedrigster
  const ranked = [...areaScores].sort((a, b) => b.coverage - a.coverage);
  const strongAreas = ranked.filter((s) => s.coverage > 0.4).slice(0, 5);
  const weakAreas = [...areaScores]
    .sort((a, b) => a.coverage - b.coverage)
    .slice(0, 6);

  // Technique-Status-Aggregat
  const techCounts: Record<TechniqueProgressStatus, number> = {
    not_started: 0,
    learned: 0,
    practiced: 0,
    mastered: 0,
  };
  for (const p of progress) {
    techCounts[p.status]++;
  }

  return {
    totalWorkouts,
    totalTrainingHours,
    weeksTracked,
    workoutsPerWeek,
    categoryDistribution,
    areaScores,
    strongAreas,
    weakAreas,
    technique: {
      total: progress.length,
      mastered: techCounts.mastered,
      practiced: techCounts.practiced,
      learned: techCounts.learned,
      notStarted: techCounts.not_started,
    },
  };
}

// ─── Gegnerspezifische Empfehlungen ────────────────────────────────────────

/**
 * Welche Bereiche sind gegen einen Gegnerstil besonders relevant?
 * Dies ist ein bewusst einfaches, regelbasiertes Mapping. Wirft keine
 * wissenschaftlichen Behauptungen auf — wird im UI als Trainer-Heuristik
 * gekennzeichnet.
 */
export const STYLE_FOCUS_AREAS: Record<FightStyle, TrainingArea[]> = {
  striker: ["takedowns", "clinch", "footwork", "defense", "ground-control"],
  grappler: [
    "takedown-defense",
    "stand-up",
    "punches",
    "kicks",
    "footwork",
    "escapes",
  ],
  wrestler: [
    "takedown-defense",
    "stand-up",
    "footwork",
    "punches",
    "guard",
    "escapes",
  ],
  "all-rounder": [
    "combos",
    "defense",
    "clinch",
    "takedown-defense",
    "transitions",
  ],
  "bjj-specialist": [
    "stand-up",
    "takedown-defense",
    "punches",
    "ground-control",
    "submissions",
    "escapes",
    "guard",
  ],
  kickboxer: [
    "kicks",
    "footwork",
    "takedowns",
    "clinch",
    "defense",
    "ground-control",
  ],
  "pressure-fighter": [
    "footwork",
    "defense",
    "combos",
    "clinch",
    "takedown-defense",
  ],
  "counter-striker": ["punches", "footwork", "combos", "takedowns", "defense"],
};

export interface FocusRecommendation {
  /** Schwerpunkt-Bereiche für diesen Gegner */
  recommendedAreas: TrainingArea[];
  /** Bereiche, die UND vom Schüler vernachlässigt UND gegen den Gegner wichtig sind */
  criticalGaps: TrainingArea[];
  /** Bereiche, die der Schüler stark hat und die gegen den Gegner zählen */
  exploitableStrengths: TrainingArea[];
}

export function recommendFocus(
  analysis: TrainingHistoryAnalysis,
  opponent: OpponentProfile,
): FocusRecommendation {
  const styleAreas = (STYLE_FOCUS_AREAS[opponent.style] ?? []).filter((a) =>
    ALL_AREAS.includes(a),
  );

  const weak = new Set(analysis.weakAreas.map((a) => a.area));
  const strong = new Set(analysis.strongAreas.map((a) => a.area));

  const criticalGaps: TrainingArea[] = styleAreas.filter((a) => weak.has(a));
  const exploitableStrengths: TrainingArea[] = styleAreas.filter((a) =>
    strong.has(a),
  );

  // Wenn keine Lücken kreuzen — alle Style-Areas mit niedriger Coverage
  if (criticalGaps.length === 0) {
    const lowCoverageStyleAreas = analysis.areaScores
      .filter((s) => styleAreas.includes(s.area))
      .sort((a, b) => a.coverage - b.coverage)
      .slice(0, 3)
      .map((s) => s.area);
    criticalGaps.push(...lowCoverageStyleAreas);
  }

  return {
    recommendedAreas: styleAreas,
    criticalGaps,
    exploitableStrengths,
  };
}
