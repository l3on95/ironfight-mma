import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/audio", () => ({
  playRoundStart: vi.fn(),
  playRoundEnd: vi.fn(),
  playSessionEnd: vi.fn(),
  playCountdownTick: vi.fn(),
  vibrateTick: vi.fn(),
  vibrateRoundEnd: vi.fn(),
  vibrateSessionEnd: vi.fn(),
}));

import * as audio from "@/lib/audio";
import { DEFAULT_CONFIG, TimerConfig, useWorkoutTimer } from "@/lib/use-workout-timer";

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function startTimer(result: ReturnType<typeof renderHook<ReturnType<typeof useWorkoutTimer>, TimerConfig>>["result"]) {
  act(() => {
    result.current.start();
  });
}

describe("useWorkoutTimer", () => {
  it("starts with idle defaults", () => {
    const { result } = renderHook(() => useWorkoutTimer());

    expect(result.current.phase).toBe("idle");
    expect(result.current.round).toBe(1);
    expect(result.current.remaining).toBe(180);
    expect(result.current.running).toBe(false);
  });

  it("moves from idle to prep when started", () => {
    const { result } = renderHook(() => useWorkoutTimer());

    startTimer(result);

    expect(result.current.phase).toBe("prep");
    expect(result.current.running).toBe(true);
    expect(result.current.remaining).toBe(10);
  });

  it("moves from prep to work and plays the round start sound", () => {
    const { result } = renderHook(() => useWorkoutTimer());

    startTimer(result);
    advance(DEFAULT_CONFIG.prepSeconds * 1000);

    expect(result.current.phase).toBe("work");
    expect(result.current.round).toBe(1);
    expect(audio.playRoundStart).toHaveBeenCalledTimes(1);
  });

  it("fires the prep countdown tick exactly once at four seconds left", () => {
    const config: TimerConfig = { rounds: 1, workSeconds: 5, restSeconds: 3, prepSeconds: 5 };
    const { result } = renderHook(() => useWorkoutTimer(config));

    startTimer(result);
    advance(1999);

    expect(result.current.phase).toBe("prep");
    expect(result.current.remaining).toBe(4);
    expect(audio.playCountdownTick).toHaveBeenCalledTimes(1);
    expect(audio.vibrateTick).toHaveBeenCalledTimes(1);
  });

  it("fires the rest countdown tick exactly once at four seconds left", () => {
    const config: TimerConfig = { rounds: 2, workSeconds: 1, restSeconds: 5, prepSeconds: 1 };
    const { result } = renderHook(() => useWorkoutTimer(config));

    startTimer(result);
    advance(1000);
    advance(1000);
    vi.mocked(audio.playCountdownTick).mockClear();
    vi.mocked(audio.vibrateTick).mockClear();
    advance(1999);

    expect(result.current.phase).toBe("rest");
    expect(result.current.remaining).toBe(4);
    expect(audio.playCountdownTick).toHaveBeenCalledTimes(1);
    expect(audio.vibrateTick).toHaveBeenCalledTimes(1);
  });

  it("moves from work to rest before the final round and signals round end", () => {
    const config: TimerConfig = { rounds: 2, workSeconds: 2, restSeconds: 3, prepSeconds: 1 };
    const { result } = renderHook(() => useWorkoutTimer(config));

    startTimer(result);
    advance(1000);
    advance(2000);

    expect(result.current.phase).toBe("rest");
    expect(result.current.round).toBe(1);
    expect(audio.playRoundEnd).toHaveBeenCalledTimes(1);
    expect(audio.vibrateRoundEnd).toHaveBeenCalledTimes(1);
  });

  it("moves from rest to work and increments the round", () => {
    const config: TimerConfig = { rounds: 2, workSeconds: 2, restSeconds: 3, prepSeconds: 1 };
    const { result } = renderHook(() => useWorkoutTimer(config));

    startTimer(result);
    advance(1000);
    advance(2000);
    advance(3000);

    expect(result.current.phase).toBe("work");
    expect(result.current.round).toBe(2);
  });

  it("moves from the final work phase to done and signals session end", () => {
    const config: TimerConfig = { rounds: 1, workSeconds: 2, restSeconds: 3, prepSeconds: 1 };
    const { result } = renderHook(() => useWorkoutTimer(config));

    startTimer(result);
    advance(1000);
    advance(2000);

    expect(result.current.phase).toBe("done");
    expect(result.current.running).toBe(false);
    expect(audio.playSessionEnd).toHaveBeenCalledTimes(1);
    expect(audio.vibrateSessionEnd).toHaveBeenCalledTimes(1);
  });

  it("counts remaining time down while running", () => {
    const config: TimerConfig = { rounds: 1, workSeconds: 5, restSeconds: 3, prepSeconds: 2 };
    const { result } = renderHook(() => useWorkoutTimer(config));

    startTimer(result);
    advance(1000);

    expect(result.current.phase).toBe("prep");
    expect(result.current.remaining).toBe(1);
  });

  it("pauses and keeps remaining time frozen", () => {
    const config: TimerConfig = { rounds: 1, workSeconds: 5, restSeconds: 3, prepSeconds: 2 };
    const { result } = renderHook(() => useWorkoutTimer(config));

    startTimer(result);
    advance(1000);
    const pausedRemaining = result.current.remaining;
    act(() => {
      result.current.pause();
    });
    advance(5000);

    expect(result.current.running).toBe(false);
    expect(result.current.remaining).toBe(pausedRemaining);
  });

  it("resets to idle defaults for the current config", () => {
    const config: TimerConfig = { rounds: 2, workSeconds: 5, restSeconds: 3, prepSeconds: 2 };
    const { result } = renderHook(() => useWorkoutTimer(config));

    startTimer(result);
    advance(1000);
    act(() => {
      result.current.reset();
    });

    expect(result.current.phase).toBe("idle");
    expect(result.current.round).toBe(1);
    expect(result.current.remaining).toBe(config.workSeconds);
    expect(result.current.running).toBe(false);
  });

  it("skips prep to work and work to rest before the final round", () => {
    const config: TimerConfig = { rounds: 2, workSeconds: 5, restSeconds: 3, prepSeconds: 2 };
    const { result } = renderHook(() => useWorkoutTimer(config));

    startTimer(result);
    act(() => {
      result.current.skip();
    });
    expect(result.current.phase).toBe("work");
    expect(result.current.round).toBe(1);

    act(() => {
      result.current.skip();
    });
    expect(result.current.phase).toBe("rest");
    expect(result.current.round).toBe(1);
  });

  it("derives idle remaining time from updated config work seconds", () => {
    const { result } = renderHook(() => useWorkoutTimer());

    act(() => {
      result.current.setConfig({ ...DEFAULT_CONFIG, workSeconds: 99 });
    });

    expect(result.current.phase).toBe("idle");
    expect(result.current.remaining).toBe(99);
  });
});
