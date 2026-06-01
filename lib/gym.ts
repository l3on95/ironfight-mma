/**
 * Gym-Zugehörigkeit — gym-übergreifendes Teilen von Gegner-DNA & Wettkämpfen.
 *
 * Aktuelle Entscheidung: Die App betreibt genau EIN Gym ("Tidal Athletics").
 * Alle Trainer/Admins teilen sich denselben Gym-Datenraum. Das Datenmodell ist
 * jedoch bereits gym-fähig: jede Gegner-DNA und jeder Wettkampf trägt eine
 * `gymId`. Sobald echtes Multi-Gym gewünscht ist, genügt es,
 *   1) `resolveGymId` auf `profile.gymId` umzustellen (Default als Fallback),
 *   2) die Listen-Queries nach `gymId` zu filtern (Helfer `belongsToGym`),
 *   3) optional die Firestore-Regeln zu verschärfen.
 * Es sind KEINE Datenmigrationen nötig — `gymId` wird ab sofort geschrieben.
 */

import type { UserProfile } from "./types";

/** Default-Gym, solange die App single-tenant betrieben wird. */
export const DEFAULT_GYM_ID = "tidal-athletics";

export const DEFAULT_GYM_LABEL = "Tidal Athletics";

/**
 * Normalisiert einen frei eingegebenen Gym-Namen zu einem stabilen Slug.
 * Wird gebraucht, sobald Gyms aus dem `gymName`-Feld abgeleitet werden.
 */
export function slugifyGym(name: string): string {
  // NFKD zerlegt Akzent-Zeichen in Basis + Markierung; der [^a-z0-9]-Filter
  // entfernt die Markierungen anschließend ohnehin.
  return (
    name
      .trim()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || DEFAULT_GYM_ID
  );
}

/**
 * Liefert die Gym-ID eines Nutzers. Heute immer das Default-Gym (single-gym),
 * respektiert aber bereits ein gesetztes `profile.gymId` für die Zukunft.
 */
export function resolveGymId(profile: UserProfile | null | undefined): string {
  return profile?.gymId?.trim() || DEFAULT_GYM_ID;
}

/**
 * Sichtbarkeits-Check: Gehört ein Datensatz (mit `gymId`) zum Gym des Trainers?
 *
 * Single-Gym-Phase: Datensätze ohne `gymId` (Altbestände) sowie Datensätze des
 * Default-Gyms sind sichtbar. So gehen keine bestehenden Wettkämpfe verloren.
 * Multi-Gym später: strikt `record.gymId === viewerGymId` vergleichen.
 */
export function belongsToGym(
  recordGymId: string | null | undefined,
  viewerGymId: string,
): boolean {
  if (!recordGymId) return true; // Altbestand ohne gymId — im Single-Gym sichtbar
  if (viewerGymId === DEFAULT_GYM_ID) return true; // Single-Gym: alles sichtbar
  return recordGymId === viewerGymId;
}
