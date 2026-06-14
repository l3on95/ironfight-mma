import { describe, expect, it } from "vitest";

import {
  actionLabel,
  actionTotals,
  cleanActionStats,
  cleanDnaSplit,
  deriveSuggestions,
  deriveTendencies,
  dnaSplitTotal,
  hasActionData,
  isActionStatsEmpty,
  isDnaSplitEmpty,
  normalizeDnaSplit,
  statsByGroup,
  successRate,
  zoneDistribution,
  type ActionStat,
  type DnaSplit,
} from "@/lib/fight-stats";

const split: DnaSplit = {
  boxing: 20,
  kicking: 10,
  wrestling: 40,
  ground: 20,
  clinch: 10,
};

const actionStats: ActionStat[] = [
  {
    id: "jab",
    attempted: 6,
    landed: 4,
    zone: "center",
    setup: "Left feint",
  },
  { id: "low-kick", attempted: 3, landed: 1, zone: "open" },
  { id: "double-leg", attempted: 5, landed: 3, zone: "cage" },
  { id: "single-leg", attempted: 2, landed: 1, zone: "cage" },
  { id: "pass", attempted: 1, landed: 1 },
];

describe("fight-stats DNA split helpers", () => {
  it("sums split values", () => {
    expect(dnaSplitTotal(split)).toBe(100);
  });

  it("returns zero for an empty split total", () => {
    expect(
      dnaSplitTotal({
        boxing: 0,
        kicking: 0,
        wrestling: 0,
        ground: 0,
        clinch: 0,
      }),
    ).toBe(0);
  });

  it("detects empty, null, and non-empty DNA splits", () => {
    expect(isDnaSplitEmpty(null)).toBe(true);
    expect(
      isDnaSplitEmpty({
        boxing: 0,
        kicking: 0,
        wrestling: 0,
        ground: 0,
        clinch: 0,
      }),
    ).toBe(true);
    expect(isDnaSplitEmpty(split)).toBe(false);
  });

  it("normalizes split values to rounded percentages", () => {
    expect(
      normalizeDnaSplit({
        boxing: 1,
        kicking: 1,
        wrestling: 1,
        ground: 0,
        clinch: 0,
      }),
    ).toEqual({
      boxing: 33,
      kicking: 33,
      wrestling: 33,
      ground: 0,
      clinch: 0,
    });
  });

  it("normalizes an empty split without dividing by zero", () => {
    expect(
      normalizeDnaSplit({
        boxing: 0,
        kicking: 0,
        wrestling: 0,
        ground: 0,
        clinch: 0,
      }),
    ).toEqual({
      boxing: 0,
      kicking: 0,
      wrestling: 0,
      ground: 0,
      clinch: 0,
    });
  });

  it("cleans split values for storage", () => {
    expect(
      cleanDnaSplit({
        boxing: 33.7,
        kicking: -5,
        wrestling: 150,
        ground: Number.NaN,
        clinch: 8.2,
      }),
    ).toEqual({
      boxing: 34,
      kicking: 0,
      wrestling: 100,
      ground: 0,
      clinch: 8,
    });
  });

  it("cleans a missing split to zeros", () => {
    expect(cleanDnaSplit(undefined)).toEqual({
      boxing: 0,
      kicking: 0,
      wrestling: 0,
      ground: 0,
      clinch: 0,
    });
  });
});

describe("fight-stats action helpers", () => {
  it("returns catalog labels and falls back to the raw id", () => {
    expect(actionLabel("jab")).toBe("Jab");
    expect(actionLabel("unknown-action")).toBe("unknown-action");
  });

  it("calculates clamped success rates", () => {
    expect(successRate({ attempted: 4, landed: 3 })).toBe(0.75);
    expect(successRate({ attempted: 2, landed: 5 })).toBe(1);
    expect(successRate({ attempted: 2, landed: -1 })).toBe(0);
  });

  it("returns zero success rate when attempts are zero", () => {
    expect(successRate({ attempted: 0, landed: 3 })).toBe(0);
  });

  it("detects whether an action stat carries data", () => {
    expect(hasActionData({ id: "jab", attempted: 1, landed: 0 })).toBe(true);
    expect(hasActionData({ id: "jab", attempted: 0, landed: 1 })).toBe(true);
    expect(hasActionData({ id: "jab", attempted: 0, landed: 0 })).toBe(false);
  });

  it("cleans action stats, removing invalid and empty rows", () => {
    expect(
      cleanActionStats([
        {
          id: "jab",
          attempted: 2.6,
          landed: 9,
          zone: "center",
          setup: "  jab feint  ",
        },
        { id: "does-not-exist", attempted: 4, landed: 4, zone: "open" },
        { id: "cross", attempted: -4, landed: -1 },
        { id: "low-kick", attempted: 2, landed: 1, zone: null, setup: "  " },
      ]),
    ).toEqual([
      {
        id: "jab",
        attempted: 3,
        landed: 3,
        zone: "center",
        setup: "jab feint",
      },
      { id: "low-kick", attempted: 2, landed: 1 },
    ]);
  });

  it("cleans missing action stats to an empty list", () => {
    expect(cleanActionStats(null)).toEqual([]);
  });

  it("detects empty and non-empty action stat lists", () => {
    expect(isActionStatsEmpty(undefined)).toBe(true);
    expect(isActionStatsEmpty([{ id: "jab", attempted: 0, landed: 0 }])).toBe(
      true,
    );
    expect(isActionStatsEmpty([{ id: "jab", attempted: 0, landed: 1 }])).toBe(
      false,
    );
  });

  it("totals attempts, landed counts, and rate", () => {
    expect(actionTotals(actionStats)).toEqual({
      attempted: 17,
      landed: 10,
      rate: 10 / 17,
    });
  });

  it("returns zero totals and rate for an empty action list", () => {
    expect(actionTotals([])).toEqual({ attempted: 0, landed: 0, rate: 0 });
  });

  it("groups active stats by action group", () => {
    expect(statsByGroup(actionStats)).toEqual([
      { group: "strike", stats: [actionStats[0]] },
      { group: "kick", stats: [actionStats[1]] },
      { group: "takedown", stats: [actionStats[2], actionStats[3]] },
      { group: "ground", stats: [actionStats[4]] },
    ]);
  });

  it("omits empty groups and empty action rows", () => {
    expect(statsByGroup([{ id: "jab", attempted: 0, landed: 0 }])).toEqual([]);
  });

  it("aggregates attempted counts by cage zone", () => {
    expect(zoneDistribution(actionStats)).toEqual({
      center: 6,
      open: 3,
      cage: 7,
    });
  });

  it("ignores rows without zones or action data in zone distribution", () => {
    expect(
      zoneDistribution([
        { id: "jab", attempted: 2, landed: 1 },
        { id: "cross", attempted: 0, landed: 0, zone: "open" },
      ]),
    ).toEqual({ center: 0, open: 0, cage: 0 });
  });
});

describe("fight-stats derived analysis", () => {
  it("derives concrete tendencies from active stats", () => {
    expect(deriveTendencies(actionStats)).toEqual([
      {
        id: "most-used",
        tone: "weapon",
        text: "Häufigste Waffe: Jab (6 Versuche).",
      },
      {
        id: "most-dangerous",
        tone: "success",
        text: "Gefährlichste Technik: Jab — 67% Trefferquote (4/6).",
      },
      {
        id: "takedown-rate",
        tone: "success",
        text: "Takedowns: 4/7 erfolgreich (57%).",
      },
      {
        id: "takedown-zone",
        tone: "zone",
        text: "100% der Takedowns passieren am Cage.",
      },
      {
        id: "setup",
        tone: "setup",
        text: "Häufige Vorbereitung: „Left feint\" leitet viele Angriffe ein.",
      },
      {
        id: "threat",
        tone: "warning",
        text: "Achtung: Jab kommt oft und trifft (67%) — Hauptbedrohung.",
      },
    ]);
  });

  it("derives no tendencies from empty stats", () => {
    expect(deriveTendencies([])).toEqual([]);
  });

  it("derives concrete suggestions from split and stats", () => {
    expect(deriveSuggestions(split, actionStats)).toEqual([
      {
        id: "td-defense",
        kind: "gameplan",
        text: "Takedown-Verteidigung priorisieren: nicht mit dem Rücken zum Cage stehen bleiben, Distanz im Center kontrollieren.",
      },
      {
        id: "drill-cage-defense",
        kind: "drill",
        text: "Drill: Cage-Wrestling — Underhooks, Wall-Walk, Wieder-Aufstehen + Knie-Konter auf den Entry.",
      },
      {
        id: "drill-setup",
        kind: "drill",
        text: "Drill: Reaktion auf „Left feint\" automatisieren — sobald das Setup kommt, Kopf sichern und kontern.",
      },
      {
        id: "drill-counter-weapon",
        kind: "drill",
        text: "Drill: Defense & Konter gegen Jab — Timing lesen und mit eigenem Konter bestrafen.",
      },
    ]);
  });

  it("derives no suggestions when split and stats are empty", () => {
    expect(deriveSuggestions(null, [])).toEqual([]);
  });
});
