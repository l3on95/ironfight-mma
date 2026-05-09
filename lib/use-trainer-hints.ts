"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Persistente "schon gesehen"-Markierung für interaktive Trainer-Hinweise.
 *
 * Die Daten liegen pro Browser im localStorage. Das ist absichtlich — Hints
 * sind reine UI-Hilfe und müssen nicht über Geräte synchron sein. So bleibt
 * der Firestore-Schreibverkehr minimal und das System funktioniert auch im
 * Offline-Modus.
 *
 * Schlüssel-Format: `ta:trainer-hint:<hintId>` → "1" wenn gesehen.
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

export function useTrainerHint(id: string): {
  seen: boolean;
  dismiss: () => void;
} {
  const [seen, setSeen] = useState(true); // initial true → vermeidet Flash

  useEffect(() => {
    setSeen(readSeen(id));
  }, [id]);

  const dismiss = useCallback(() => {
    writeSeen(id);
    setSeen(true);
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
  } catch {
    // ignore
  }
}
