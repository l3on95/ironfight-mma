import { describe, expect, it } from 'vitest';

import {
  STYLE_FOCUS_AREAS,
  analyzeTrainingHistory,
  recommendFocus,
  type AreaScore,
  type TrainingHistoryAnalysis,
} from '@/lib/fight-camp-analysis';
import type { FightStyle, OpponentProfile } from '@/lib/fight-camp';
import {
  TRAINING_AREA_LABEL,
  type Category,
  type TechniqueProgress,
  type TrainingArea,
} from '@/lib/types';
import type { WorkoutSession } from '@/lib/workouts';

const trainingAreas: TrainingArea[] = [
  'stand-up',
  'footwork',
  'punches',
  'kicks',
  'knees',
  'elbows',
  'clinch',
  'takedowns',
  'takedown-defense',
  'ground-control',
  'guard',
  'sweeps',
  'submissions',
  'escapes',
  'transitions',
  'defense',
  'combos',
  'drills',
];

const categories: Category[] = ['boxing', 'wrestling', 'bjj', 'muay-thai'];

function workout(
  id: string,
  category: Category | null,
  completedAt: Date,
  techniqueIds: string[] = [],
  totalWorkSeconds = 600,
): WorkoutSession {
  return {
    id,
    label: id,
    category,
    difficulty: 'anfaenger',
    rounds: 1,
    workSeconds: totalWorkSeconds,
    restSeconds: 0,
    completedAt,
    totalWorkSeconds,
    status: 'completed',
    exerciseIds: [],
    techniqueIds,
  };
}

function progress(
  techniqueId: string,
  status: TechniqueProgress['status'],
): TechniqueProgress {
  return { techniqueId, status, practiceCount: 1 };
}

function areaScore(
  area: TrainingArea,
  coverage: number,
  workoutCount = 0,
): AreaScore {
  return {
    area,
    label: TRAINING_AREA_LABEL[area],
    workoutCount,
    practicedTechniqueCount: 0,
    masteredTechniqueCount: 0,
    coverage,
  };
}

function analysisForRecommendation(
  weakAreas: TrainingArea[],
  strongAreas: TrainingArea[],
): TrainingHistoryAnalysis {
  const scores = trainingAreas.map((area) => areaScore(area, 0.5));
  return {
    totalWorkouts: 3,
    totalTrainingHours: 1,
    weeksTracked: 1,
    workoutsPerWeek: 3,
    categoryDistribution: categories.map((category) => ({
      category,
      workoutCount: 0,
      shareOfTotal: 0,
    })),
    areaScores: scores,
    strongAreas: strongAreas.map((area) => areaScore(area, 1, 2)),
    weakAreas: weakAreas.map((area) => areaScore(area, 0, 0)),
    technique: {
      total: 0,
      mastered: 0,
      practiced: 0,
      learned: 0,
      notStarted: 0,
    },
  };
}

function opponent(style: FightStyle): OpponentProfile {
  return {
    name: 'Testgegner',
    style,
    stance: 'orthodox',
    strengths: [],
    weaknesses: [],
    favoriteAttacks: [],
  };
}

describe('analyzeTrainingHistory', () => {
  it('liefert bei leerer Historie stabile Nullwerte und vollständige Bereiche', () => {
    const result = analyzeTrainingHistory([], []);

    expect(result.totalWorkouts).toBe(0);
    expect(result.totalTrainingHours).toBe(0);
    expect(result.weeksTracked).toBe(1);
    expect(result.workoutsPerWeek).toBe(0);

    expect(result.categoryDistribution).toEqual(
      categories.map((category) => ({
        category,
        workoutCount: 0,
        shareOfTotal: 0,
      })),
    );

    // Jeder Trainingsbereich muss auch ohne Daten sichtbar bleiben, damit UI
    // und Generator mit festen Achsen rechnen können.
    expect(result.areaScores.map((s) => s.area)).toEqual(trainingAreas);
    expect(result.areaScores.every((s) => s.coverage === 0)).toBe(true);
    expect(result.areaScores.every((s) => s.workoutCount === 0)).toBe(true);
    expect(result.strongAreas).toEqual([]);
    expect(result.weakAreas.map((s) => s.area)).toEqual(
      trainingAreas.slice(0, 6),
    );
    expect(result.technique).toEqual({
      total: 0,
      mastered: 0,
      practiced: 0,
      learned: 0,
      notStarted: 0,
    });
  });

  it('wertet einen einzelnen Technik-Workout in die passenden Areas aus', () => {
    const result = analyzeTrainingHistory(
      [
        workout(
          'jab-session',
          'boxing',
          new Date('2026-01-01T10:00:00.000Z'),
          ['boxing_jab'],
          1800,
        ),
      ],
      [progress('boxing_jab', 'mastered')],
    );

    const standUp = result.areaScores.find((s) => s.area === 'stand-up');
    const punches = result.areaScores.find((s) => s.area === 'punches');

    expect(result.totalWorkouts).toBe(1);
    expect(result.totalTrainingHours).toBe(0.5);
    expect(result.weeksTracked).toBe(1);
    expect(result.workoutsPerWeek).toBe(1);
    expect(result.categoryDistribution[0]).toEqual({
      category: 'boxing',
      workoutCount: 1,
      shareOfTotal: 1,
    });

    // Die Technikdatenbank mappt boxing_jab auf Stand-Up und Punches; beide
    // Bereiche müssen denselben Workout nur einmal zählen.
    expect(standUp).toMatchObject({
      workoutCount: 1,
      practicedTechniqueCount: 1,
      masteredTechniqueCount: 1,
      coverage: 1,
    });
    expect(punches).toMatchObject({
      workoutCount: 1,
      practicedTechniqueCount: 1,
      masteredTechniqueCount: 1,
      coverage: 1,
    });
    expect(result.strongAreas.map((s) => s.area)).toEqual([
      'stand-up',
      'punches',
    ]);
    expect(result.technique).toEqual({
      total: 1,
      mastered: 1,
      practiced: 0,
      learned: 0,
      notStarted: 0,
    });
  });

  it('normalisiert Kategorien und sortiert Stärken und Schwächen nach Coverage', () => {
    const result = analyzeTrainingHistory(
      [
        workout('jab-1', 'boxing', new Date('2026-01-01T00:00:00.000Z'), [
          'boxing_jab',
        ]),
        workout('jab-2', 'boxing', new Date('2026-01-08T00:00:00.000Z'), [
          'boxing_cross',
        ]),
        workout(
          'sprawl',
          'wrestling',
          new Date('2026-01-15T00:00:00.000Z'),
          ['wrestling_sprawl'],
        ),
        workout('frei', null, new Date('2026-01-22T00:00:00.000Z')),
      ],
      [
        progress('boxing_jab', 'mastered'),
        progress('boxing_cross', 'practiced'),
        progress('wrestling_sprawl', 'learned'),
        progress('unknown_id', 'not_started'),
      ],
    );

    const shares = result.categoryDistribution.map((d) => d.shareOfTotal);
    const punchScore = result.areaScores.find((s) => s.area === 'punches');
    const defenseScore = result.areaScores.find((s) => s.area === 'takedown-defense');

    expect(result.totalWorkouts).toBe(4);
    expect(result.weeksTracked).toBe(3);
    expect(result.workoutsPerWeek).toBe(1.3);
    expect(result.categoryDistribution.map((d) => d.category)).toEqual([
      'boxing',
      'wrestling',
      'bjj',
      'muay-thai',
    ]);
    expect(shares.reduce((sum, share) => sum + share, 0)).toBe(0.75);
    expect(shares.every((share) => share >= 0 && share <= 1)).toBe(true);

    // Coverage wird gegen den meisttrainierten Bereich normalisiert und muss
    // dadurch in einer sortierbaren 0..1-Spanne bleiben.
    expect(punchScore?.coverage).toBe(1);
    expect(defenseScore?.coverage).toBe(0.5);
    expect(result.areaScores.every((s) => s.coverage >= 0 && s.coverage <= 1)).toBe(
      true,
    );
    expect(result.strongAreas.map((s) => s.coverage)).toEqual([1, 1, 0.5]);
    expect(result.weakAreas.map((s) => s.coverage)).toEqual([0, 0, 0, 0, 0, 0]);
    expect(result.technique).toEqual({
      total: 4,
      mastered: 1,
      practiced: 1,
      learned: 1,
      notStarted: 1,
    });
  });
});

describe('STYLE_FOCUS_AREAS / recommendFocus', () => {
  it('definiert für jeden Gegnerstil gültige Fokusbereiche', () => {
    const expectedStyles: FightStyle[] = [
      'striker',
      'grappler',
      'wrestler',
      'all-rounder',
      'bjj-specialist',
      'kickboxer',
      'pressure-fighter',
      'counter-striker',
    ];

    expect(Object.keys(STYLE_FOCUS_AREAS).sort()).toEqual(
      [...expectedStyles].sort(),
    );

    for (const style of expectedStyles) {
      const areas = STYLE_FOCUS_AREAS[style];

      // Leere oder ungültige Style-Mappings würden spätere Camp-Phasen ohne
      // gegnerspezifischen Schwerpunkt erzeugen.
      expect(areas.length).toBeGreaterThan(0);
      expect(new Set(areas).size).toBe(areas.length);
      expect(areas.every((area) => trainingAreas.includes(area))).toBe(true);
    }
  });

  it('leitet kritische Lücken und nutzbare Stärken aus Analyse und Stil ab', () => {
    const analysis = analysisForRecommendation(
      ['takedowns', 'defense', 'guard'],
      ['footwork', 'punches'],
    );

    const result = recommendFocus(analysis, opponent('striker'));

    expect(result.recommendedAreas).toEqual(STYLE_FOCUS_AREAS.striker);
    expect(result.criticalGaps).toEqual(['takedowns', 'defense']);
    expect(result.exploitableStrengths).toEqual(['footwork']);
  });

  it('nutzt bei fehlender Schnittmenge die niedrigste Style-Coverage', () => {
    const analysis = analysisForRecommendation(['guard'], []);
    analysis.areaScores = trainingAreas.map((area) =>
      areaScore(area, area === 'footwork' ? 0.1 : 0.8),
    );

    const result = recommendFocus(analysis, opponent('striker'));

    expect(result.criticalGaps).toEqual([
      'footwork',
      'clinch',
      'takedowns',
    ]);
    expect(result.exploitableStrengths).toEqual([]);
  });

  it('bleibt ohne Trainingsdaten handlungsfähig', () => {
    const analysis = analyzeTrainingHistory([], []);
    const result = recommendFocus(analysis, opponent('grappler'));

    // Auch ein neuer Athlet braucht eine Style-Empfehlung statt leerer UI.
    expect(result.recommendedAreas).toEqual(STYLE_FOCUS_AREAS.grappler);
    expect(result.criticalGaps.length).toBeGreaterThan(0);
    expect(result.exploitableStrengths).toEqual([]);
  });
});
