import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { generateWorkout } from "@/lib/workout-generator";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-15T12:00:00.000Z"));
  vi.spyOn(Math, "random").mockReturnValue(0);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("generateWorkout", () => {
  it("returns a full generated workout with all required fields", () => {
    const workout = generateWorkout({
      category: "boxing",
      difficulty: "anfaenger",
      equipment: ["heavy-bag"],
      durationMinutes: 30,
      label: "Bag Session",
    });

    expect(workout).toEqual({
      id: "gen-1781524800000",
      label: "Bag Session",
      category: "boxing",
      difficulty: "anfaenger",
      rounds: 3,
      workSeconds: 180,
      restSeconds: 60,
      prepSeconds: 10,
      blocks: [
        { phase: "warmup", exerciseIds: ["warmup_shadowbox"] },
        {
          phase: "main",
          exerciseIds: ["boxing_jab_cross_bag", "boxing_shadow_combos"],
        },
        {
          phase: "conditioning",
          exerciseIds: ["cond_burpees", "cond_sit_ups"],
        },
        { phase: "cooldown", exerciseIds: ["cooldown_stretch"] },
      ],
      generatedFrom: {
        equipment: ["heavy-bag"],
        durationMinutes: 30,
        category: "boxing",
        difficulty: "anfaenger",
      },
    });
  });

  it("omits conditioning and cooldown for short workouts", () => {
    const workout = generateWorkout({
      category: "boxing",
      difficulty: "anfaenger",
      equipment: [],
      durationMinutes: 10,
    });

    expect(workout.label).toBe("Boxing 10 min");
    expect(workout.blocks).toEqual([
      { phase: "warmup", exerciseIds: ["warmup_shadowbox"] },
      { phase: "main", exerciseIds: ["boxing_shadow_combos"] },
    ]);
    expect(workout.generatedFrom).toEqual({
      equipment: [],
      durationMinutes: 10,
      category: "boxing",
      difficulty: "anfaenger",
    });
  });

  it("clamps duration below the documented input range", () => {
    const workout = generateWorkout({
      category: "wrestling",
      difficulty: "pro",
      equipment: [],
      durationMinutes: 0,
    });

    expect(workout.label).toBe("Wrestling 5 min");
    expect(workout.generatedFrom?.durationMinutes).toBe(5);
    expect(workout.blocks).toEqual([
      { phase: "warmup", exerciseIds: ["warmup_jumping_jacks"] },
    ]);
  });

  it("clamps long durations and keeps workout block shape stable", () => {
    const workout = generateWorkout({
      category: "muay-thai",
      difficulty: "fortgeschritten",
      equipment: ["pads"],
      durationMinutes: 999,
    });

    expect(workout.label).toBe("Muay-thai 120 min");
    expect(workout.generatedFrom?.durationMinutes).toBe(120);
    expect(workout.blocks.map((block) => block.phase)).toEqual([
      "warmup",
      "main",
      "conditioning",
      "cooldown",
    ]);
    expect(workout.blocks).toHaveLength(4);
    expect(
      workout.blocks.every((block) => block.exerciseIds.length > 0),
    ).toBe(true);
  });
});
