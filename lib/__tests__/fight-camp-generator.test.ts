import { describe, expect, it } from 'vitest';

import { EXERCISES } from '@/lib/exercises';
import { analyzeTrainingHistory } from '@/lib/fight-camp-analysis';
import {
  generateFightCamp,
  generateFightCampPhases,
  type GeneratePlanInput,
} from '@/lib/fight-camp-generator';
import type { FightCampPhase, OpponentProfile } from '@/lib/fight-camp';
import { ALL_TECHNIQUES } from '@/lib/techniques';
import type { Category, TechniqueProgress } from '@/lib/types';
import type { WorkoutSession } from '@/lib/workouts';

const dayMs = 24 * 3600 * 1000;
const weekMs = 7 * dayMs;
const phaseOrder: FightCampPhase[] = [
  'foundation',
  'specific-prep',
  'sparring-simulation',
  'taper',
];
const primaryCategories: Category[] = ['boxing', 'wrestling', 'bjj', 'muay-thai'];

const techniqueIds = new Set(ALL_TECHNIQUES.map((t) => t.id));
const exerciseIds = new Set(EXERCISES.map((e) => e.id));

function workout(
  id: string,
  category: Category,
  completedAt: Date,
  ids: string[],
): WorkoutSession {
  return {
    id,
    label: id,
    category,
    difficulty: 'fortgeschritten',
    rounds: 3,
    workSeconds: 180,
    restSeconds: 60,
    completedAt,
    totalWorkSeconds: 540,
    status: 'completed',
    exerciseIds: [],
    techniqueIds: ids,
  };
}

function progress(
  techniqueId: string,
  status: TechniqueProgress['status'],
): TechniqueProgress {
  return { techniqueId, status, practiceCount: 2 };
}

function opponent(): OpponentProfile {
  return {
    name: 'Southpaw Grappler',
    style: 'grappler',
    stance: 'southpaw',
    strengths: ['Double Leg'],
    weaknesses: ['Boxing Defense'],
    favoriteAttacks: ['Shot to Half Guard'],
  };
}

function input(overrides: Partial<GeneratePlanInput> = {}): GeneratePlanInput {
  const analysis = analyzeTrainingHistory(
    [
      workout('boxing', 'boxing', new Date('2026-01-01T00:00:00.000Z'), [
        'boxing_jab',
        'boxing_cross',
      ]),
      workout('wrestling', 'wrestling', new Date('2026-01-08T00:00:00.000Z'), [
        'wrestling_sprawl',
      ]),
      workout('bjj', 'bjj', new Date('2026-01-15T00:00:00.000Z'), [
        'bjj_armbar_from_guard',
      ]),
    ],
    [
      progress('boxing_jab', 'mastered'),
      progress('boxing_cross', 'practiced'),
      progress('wrestling_sprawl', 'learned'),
      progress('bjj_armbar_from_guard', 'not_started'),
    ],
  );

  return {
    weeksTotal: 10,
    startedAt: new Date('2026-02-02T00:00:00.000Z'),
    competitionDate: new Date('2026-04-13T00:00:00.000Z'),
    athleteLevel: 'intermediate',
    analysis,
    opponent: opponent(),
    ...overrides,
  };
}

describe('generateFightCampPhases', () => {
  it('erzeugt die vier Phasen in fester Reihenfolge mit konsistenter Zeitachse', () => {
    const planInput = input();
    const phases = generateFightCampPhases(planInput);

    expect(phases.map((p) => p.phase)).toEqual(phaseOrder);
    expect(phases.map((p) => p.weeks)).toEqual([4, 3, 2, 1]);
    expect(phases[0].startsAt).toEqual(planInput.startedAt);
    expect(phases.at(-1)?.endsAt).toEqual(planInput.competitionDate);

    for (const [index, phase] of phases.entries()) {
      // Die Wochenzahl ist die Grundlage für Kalender-UI und Trainingslast.
      expect(phase.endsAt.getTime() - phase.startsAt.getTime()).toBe(
        phase.weeks * weekMs,
      );
      if (index > 0) {
        expect(phase.startsAt).toEqual(phases[index - 1].endsAt);
      }
    }
  });

  it('liefert gültige Techniken und Übungen ohne Duplikate pro Phase', () => {
    const phases = generateFightCampPhases(input());

    for (const phase of phases) {
      // IDs müssen gegen echte Kataloge auflösbar sein, sonst bricht die
      // spätere Detailanzeige des Fight-Camps.
      expect(phase.techniqueIds.length).toBeGreaterThan(0);
      expect(phase.exerciseIds.length).toBeGreaterThan(0);
      expect(phase.techniqueIds.every((id) => techniqueIds.has(id))).toBe(true);
      expect(phase.exerciseIds.every((id) => exerciseIds.has(id))).toBe(true);
      expect(new Set(phase.techniqueIds).size).toBe(phase.techniqueIds.length);
      expect(new Set(phase.exerciseIds).size).toBe(phase.exerciseIds.length);
      expect(new Set(phase.trainingAreas).size).toBe(phase.trainingAreas.length);
    }
  });

  it('setzt Phase-Metadaten in erwartbaren Wertebereichen', () => {
    const phases = generateFightCampPhases(input({ athleteLevel: 'advanced' }));

    for (const phase of phases) {
      // Diese Werte steuern Trainingsdichte und Sparring-Anteil; sie dürfen
      // nicht außerhalb sinnvoller UI- und Planungsgrenzen fallen.
      expect(phase.focus.trim().length).toBeGreaterThan(0);
      expect(phase.categories).toEqual(primaryCategories);
      expect(phase.trainingAreas.length).toBeGreaterThan(0);
      expect(phase.sessionsPerWeek).toBeGreaterThan(0);
      expect(phase.sparringRatio).toBeGreaterThanOrEqual(0);
      expect(phase.sparringRatio).toBeLessThanOrEqual(1);
      expect(phase.weeks).toBeGreaterThan(0);
    }
  });
});

describe('generateFightCamp', () => {
  it('berechnet die Camp-Dauer aus Start- und Kampfdatum und übernimmt Stammdaten', () => {
    const startedAt = new Date('2026-05-01T00:00:00.000Z');
    const competitionDate = new Date('2026-06-26T00:00:00.000Z');
    const planInput = input({
      startedAt,
      competitionDate,
      weeksTotal: 8,
      athleteLevel: 'competitor',
    });

    const camp = generateFightCamp({
      studentUid: 'student-1',
      createdBy: 'coach-1',
      competitionDate,
      competitionName: 'Berlin Open',
      startedAt,
      athleteLevel: planInput.athleteLevel,
      analysis: planInput.analysis,
      opponent: planInput.opponent,
    });

    expect(camp).toMatchObject({
      studentUid: 'student-1',
      createdBy: 'coach-1',
      competitionDate,
      competitionName: 'Berlin Open',
      weeksTotal: 8,
      startedAt,
      opponent: planInput.opponent,
      status: 'active',
    });
    expect(camp.phases.map((p) => p.phase)).toEqual(phaseOrder);
    expect(camp.phases.reduce((sum, phase) => sum + phase.weeks, 0)).toBe(
      camp.weeksTotal,
    );
    expect(camp.phases.at(-1)?.endsAt).toEqual(competitionDate);
  });
});
