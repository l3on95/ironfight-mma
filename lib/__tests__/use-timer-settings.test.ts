import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/audio", () => ({
  setAudioMuted: vi.fn(),
  setVibrationEnabled: vi.fn(),
}));

import * as audio from "@/lib/audio";
import { useTimerSettings } from "@/lib/use-timer-settings";

const STORAGE_KEY = "ironfight.timer.settings.v1";

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("useTimerSettings", () => {
  it("uses defaults when storage is empty", () => {
    const { result } = renderHook(() => useTimerSettings());

    expect(result.current.settings).toEqual({
      soundOn: true,
      vibrate: true,
      wakeLock: true,
    });
  });

  it("reads persisted partial settings merged over defaults", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ soundOn: false }));

    const { result } = renderHook(() => useTimerSettings());

    expect(result.current.settings).toEqual({
      soundOn: false,
      vibrate: true,
      wakeLock: true,
    });
  });

  it("syncs audio and vibration settings on mount", () => {
    renderHook(() => useTimerSettings());

    expect(audio.setAudioMuted).toHaveBeenCalledWith(false);
    expect(audio.setVibrationEnabled).toHaveBeenCalledWith(true);
  });

  it("persists sound updates and mutes audio when sound is off", () => {
    const { result } = renderHook(() => useTimerSettings());
    vi.clearAllMocks();

    act(() => {
      result.current.setSoundOn(false);
    });

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")).toEqual({
      soundOn: false,
      vibrate: true,
      wakeLock: true,
    });
    expect(result.current.settings.soundOn).toBe(false);
    expect(audio.setAudioMuted).toHaveBeenCalledWith(true);
  });

  it("disables vibration through the audio module when vibration is off", () => {
    const { result } = renderHook(() => useTimerSettings());
    vi.clearAllMocks();

    act(() => {
      result.current.setVibrate(false);
    });

    expect(result.current.settings.vibrate).toBe(false);
    expect(audio.setVibrationEnabled).toHaveBeenCalledWith(false);
  });
});
