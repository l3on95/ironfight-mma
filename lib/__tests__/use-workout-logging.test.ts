import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/workouts", () => ({
  logWorkout: vi.fn(),
}));

import { logWorkout } from "@/lib/workouts";
import type { Phase, TimerConfig } from "@/lib/use-workout-timer";
import { useWorkoutLogging } from "@/lib/use-workout-logging";

const logWorkoutMock = vi.mocked(logWorkout);

const config: TimerConfig = {
  rounds: 1,
  workSeconds: 60,
  restSeconds: 30,
  prepSeconds: 5,
};

async function flushPromises() {
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  logWorkoutMock.mockResolvedValue(undefined);
});

describe("useWorkoutLogging", () => {
  it("bleibt initial idle und loggt Nicht-Done-Phasen nicht", () => {
    const { result, rerender } = renderHook(
      ({ phase }) => useWorkoutLogging(phase, "user-1", config, "Boxing"),
      { initialProps: { phase: "idle" as Phase } },
    );

    expect(result.current).toBe("idle");

    rerender({ phase: "prep" });
    expect(result.current).toBe("idle");

    rerender({ phase: "work" });
    expect(result.current).toBe("idle");

    rerender({ phase: "rest" });
    expect(result.current).toBe("idle");
    expect(logWorkoutMock).not.toHaveBeenCalled();
  });

  it("loggt in Done mit User einmal und wechselt von saving zu saved", async () => {
    const { result } = renderHook(() => useWorkoutLogging("done", "user-1", config, "Boxing"));

    expect(result.current).toBe("saving");
    expect(logWorkoutMock).toHaveBeenCalledTimes(1);
    expect(logWorkoutMock).toHaveBeenCalledWith("user-1", config, "Boxing");

    await flushPromises();

    expect(result.current).toBe("saved");
  });

  it("setzt bei einem fehlgeschlagenen Log den Status error", async () => {
    logWorkoutMock.mockRejectedValueOnce(new Error("failed"));

    const { result } = renderHook(() => useWorkoutLogging("done", "user-1", config, "Boxing"));

    await flushPromises();

    expect(result.current).toBe("error");
  });

  it("loggt bei Re-Renders in Done nicht doppelt", async () => {
    const { rerender } = renderHook(
      ({ label }) => useWorkoutLogging("done", "user-1", config, label),
      { initialProps: { label: "Boxing" } },
    );

    rerender({ label: "Boxing" });
    await flushPromises();

    expect(logWorkoutMock).toHaveBeenCalledTimes(1);
  });

  it("loggt nach done idle done erneut", async () => {
    const { rerender } = renderHook(
      ({ phase }) => useWorkoutLogging(phase, "user-1", config, "Boxing"),
      { initialProps: { phase: "done" as Phase } },
    );

    await flushPromises();
    expect(logWorkoutMock).toHaveBeenCalledTimes(1);

    rerender({ phase: "idle" });
    expect(logWorkoutMock).toHaveBeenCalledTimes(1);

    rerender({ phase: "done" });
    await flushPromises();

    expect(logWorkoutMock).toHaveBeenCalledTimes(2);
  });

  it("bleibt in Done ohne User idle und loggt nicht", () => {
    const { result } = renderHook(() => useWorkoutLogging("done", null, config, "Boxing"));

    expect(result.current).toBe("idle");
    expect(logWorkoutMock).not.toHaveBeenCalled();
  });
});
