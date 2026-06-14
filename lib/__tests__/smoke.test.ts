import { describe, it, expect } from "vitest";
import { DEFAULT_CONFIG } from "@/lib/use-workout-timer";

describe("vitest harness", () => {
  it("runs", () => {
    expect(1).toBe(1);
  });

  it("resolves the @/ alias", () => {
    expect(DEFAULT_CONFIG.rounds).toBe(5);
  });
});
