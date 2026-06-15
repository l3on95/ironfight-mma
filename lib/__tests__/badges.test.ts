import { describe, expect, it } from "vitest";

import {
  AVAILABLE_BADGES,
  xpForWorkout,
  levelForXp,
} from "@/lib/extensions/badges";

describe("AVAILABLE_BADGES", () => {
  it("hat eindeutige Badge-IDs", () => {
    const ids = AVAILABLE_BADGES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("enthält das Einstiegs-Badge", () => {
    expect(ids(AVAILABLE_BADGES)).toContain("first_workout");
  });
});

function ids(badges: { id: string }[]): string[] {
  return badges.map((b) => b.id);
}

describe("xpForWorkout", () => {
  it("vergibt 1 XP pro Minute (auf Minuten gerundet)", () => {
    expect(xpForWorkout(0)).toBe(0);
    expect(xpForWorkout(60)).toBe(1);
    expect(xpForWorkout(3600)).toBe(60);
  });

  it("rundet Sekunden kaufmännisch auf volle Minuten", () => {
    expect(xpForWorkout(30)).toBe(1); // 0.5 → 1
    expect(xpForWorkout(89)).toBe(1); // 1.48 → 1
    expect(xpForWorkout(90)).toBe(2); // 1.5 → 2
    expect(xpForWorkout(150)).toBe(3); // 2.5 → 3
  });
});

describe("levelForXp", () => {
  it("startet auf Level 1 mit Schwelle 50", () => {
    expect(levelForXp(0)).toEqual({ level: 1, nextAt: 50 });
    expect(levelForXp(49)).toEqual({ level: 1, nextAt: 50 });
  });

  it("steigt an den quadratischen Schwellen n²·50 auf", () => {
    expect(levelForXp(50)).toEqual({ level: 2, nextAt: 200 });
    expect(levelForXp(199)).toEqual({ level: 2, nextAt: 200 });
    expect(levelForXp(200)).toEqual({ level: 3, nextAt: 450 });
    expect(levelForXp(449)).toEqual({ level: 3, nextAt: 450 });
    expect(levelForXp(450)).toEqual({ level: 4, nextAt: 800 });
  });

  it("hält die Invariante nextAt > xp", () => {
    for (const xp of [0, 49, 50, 123, 200, 799, 5000]) {
      expect(levelForXp(xp).nextAt).toBeGreaterThan(xp);
    }
  });
});
