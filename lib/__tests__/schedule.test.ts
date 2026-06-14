import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getBlocksForDay,
  getCurrentWeekday,
  getWeekIdentifier,
} from "@/lib/schedule";

afterEach(() => {
  vi.useRealTimers();
});

describe("schedule date helpers", () => {
  it("returns the ISO week identifier for an explicit known date", () => {
    expect(getWeekIdentifier(new Date("2026-06-15T12:00:00.000Z"))).toBe(
      "2026-W25",
    );
  });

  it("uses European weekday numbering for the current date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00.000Z"));

    expect(getCurrentWeekday()).toBe(0);
  });

  it("maps Sunday to weekday index 6", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-21T12:00:00.000Z"));

    expect(getCurrentWeekday()).toBe(6);
  });
});

describe("getBlocksForDay", () => {
  it("returns Monday blocks", () => {
    expect(getBlocksForDay(0).map((block) => block.id)).toEqual([
      "mon-01",
      "mon-02",
      "mon-03",
      "mon-04",
    ]);
  });

  it("returns Tuesday blocks", () => {
    expect(getBlocksForDay(1).map((block) => block.id)).toEqual([
      "tue-01",
      "tue-02",
      "tue-03",
      "tue-04",
    ]);
  });

  it("returns Wednesday blocks", () => {
    expect(getBlocksForDay(2).map((block) => block.id)).toEqual([
      "wed-01",
      "wed-02",
      "wed-03",
      "wed-04",
    ]);
  });

  it("returns Thursday blocks", () => {
    expect(getBlocksForDay(3).map((block) => block.id)).toEqual([
      "thu-01",
      "thu-02",
      "thu-03",
      "thu-04",
      "thu-05",
    ]);
  });

  it("returns Friday blocks", () => {
    expect(getBlocksForDay(4).map((block) => block.id)).toEqual([
      "fri-01",
      "fri-02",
      "fri-03",
      "fri-04",
    ]);
  });

  it("returns Saturday blocks", () => {
    expect(getBlocksForDay(5).map((block) => block.id)).toEqual([
      "sat-01",
      "sat-02",
    ]);
  });

  it("returns Sunday blocks", () => {
    expect(getBlocksForDay(6).map((block) => block.id)).toEqual(["sun-01"]);
  });

  it("returns no blocks for an out-of-range weekday", () => {
    expect(getBlocksForDay(7)).toEqual([]);
  });
});
