"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { setAudioMuted, setVibrationEnabled } from "./audio";

/**
 * Persistente Timer-Settings (Sound, Vibration, Wake-Lock).
 * Wird im localStorage gespeichert, damit es auf Mobile zwischen
 * Sessions erhalten bleibt.
 *
 * Gelesen wird über `useSyncExternalStore`. Der Snapshot wird per Roh-String
 * memoisiert, damit er bei unverändertem Storage referenzstabil bleibt
 * (sonst Render-Schleife). Die Audio-/Vibrations-Nebenwirkungen laufen in
 * einem Effekt, der auf `settings` reagiert.
 */
export interface TimerSettings {
  soundOn: boolean;
  vibrate: boolean;
  wakeLock: boolean;
}

const STORAGE_KEY = "ironfight.timer.settings.v1";

const DEFAULT: TimerSettings = {
  soundOn: true,
  vibrate: true,
  wakeLock: true,
};

let cachedRaw: string | null = null;
let cachedValue: TimerSettings = DEFAULT;

function getSnapshot(): TimerSettings {
  if (typeof window === "undefined") return DEFAULT;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return cachedValue;
  }
  if (raw === cachedRaw) return cachedValue;
  cachedRaw = raw;
  try {
    cachedValue = raw
      ? { ...DEFAULT, ...(JSON.parse(raw) as Partial<TimerSettings>) }
      : DEFAULT;
  } catch {
    cachedValue = DEFAULT;
  }
  return cachedValue;
}

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function emit() {
  listeners.forEach((l) => l());
}

export function useTimerSettings() {
  const settings = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT);

  // Externe Audio-/Vibrations-Systeme mit dem State synchron halten.
  useEffect(() => {
    setAudioMuted(!settings.soundOn);
    setVibrationEnabled(settings.vibrate);
  }, [settings]);

  const update = useCallback((patch: Partial<TimerSettings>) => {
    const next = { ...getSnapshot(), ...patch };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota errors */
    }
    emit();
  }, []);

  return {
    settings,
    setSoundOn: (v: boolean) => update({ soundOn: v }),
    setVibrate: (v: boolean) => update({ vibrate: v }),
    setWakeLock: (v: boolean) => update({ wakeLock: v }),
  };
}
