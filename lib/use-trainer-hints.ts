"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Persistente "schon gesehen"-Markierung für interaktive Trainer-Hinweise.
 *
 * Die Daten liegen pro Browser im localStorage. Das ist absichtlich — Hints
 * sind reine UI-Hilfe und müssen nicht über Geräte synchron sein. So bleibt
 * der Firestore-Schreibverkehr minimal und das System funktioniert auch im
 * Offline-Modus.
 *
 * Schlüssel-Format: `ta:trainer-hint:<hintId>` → "1" wenn gesehen.
 *
 * Gelesen wird über `useSyncExternalStore`: Der Server-Snapshot ist immer
 * `true` (vermeidet ein Flash beim Hydrieren), der Client-Snapshot liest den
 * echten Wert aus dem localStorage.
 */
const STORAGE_PREFIX = "ta:trainer-hint:";

function storageKey(id: string) {
  return `${STORAGE_PREFIX}${id}`;
}

function readSeen(id: string): boolean {
  if (typeof window === "undefined") return true; // SSR: nie zeigen
  try {
    return window.localStorage.getItem(storageKey(id)) === "1";
  } catch {
    return false;
  }
}

function writeSeen(id: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(id), "1");
  } catch {
    // localStorage kann z. B. im Privatmodus blockiert sein → still ignorieren
  }
}

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  // Auch auf Änderungen in anderen Tabs reagieren.
  const onStorage = (e: StorageEvent) => {
    if (!e.key || e.key.startsWith(STORAGE_PREFIX)) cb();
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

function emit() {
  listeners.forEach((l) => l());
}

export function useTrainerHint(id: string): {
  seen: boolean;
  dismiss: () => void;
} {
  const seen = useSyncExternalStore(
    subscribe,
    () => readSeen(id), // Client-Snapshot
    () => true, // Server-Snapshot → kein Flash
  );

  const dismiss = useCallback(() => {
    writeSeen(id);
    emit();
  }, [id]);

  return { seen, dismiss };
}

/** Nur für Tests/Debug — entfernt alle Trainer-Hint-Marker. */
export function resetAllTrainerHints() {
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
    emit();
  } catch {
    // ignore
  }
}
