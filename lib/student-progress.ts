/**
 * Aggregiert Fortschrittsdaten eines Schülers für die Trainer-Sicht.
 *
 * Liest aus:
 *   users/{uid}/workouts          — Workout-Sessions
 *   users/{uid}/library           — Persönliche Bibliothek
 *   users/{uid}/subscriptions     — Kurs-Abos
 *   users/{uid}/participations    — Teilnahmen
 *
 * Hinweis Datenschutz: Erfordert Firestore-Regeln, die Trainern Lese-Zugriff
 * auf diese Sub-Collections erlauben. Schlägt der Zugriff fehl, gibt es
 * `null`-Werte zurück — das UI zeigt dann saubere Platzhalter.
 */

import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { getFirestoreDb } from "./firebase";

export type StudentProgress = {
  workoutsTotal: number | null;
  libraryCount: number | null;
  subscriptionCount: number | null;
  participationCount: number | null;
  lastWorkoutAt: Date | null;
  lastParticipationAt: Date | null;
  /** True wenn mindestens ein Datenpunkt geladen wurde — sonst Fallback */
  hasAnyData: boolean;
};

const EMPTY: StudentProgress = {
  workoutsTotal: null,
  libraryCount: null,
  subscriptionCount: null,
  participationCount: null,
  lastWorkoutAt: null,
  lastParticipationAt: null,
  hasAnyData: false,
};

async function safeCount(
  uid: string,
  sub: string,
): Promise<number | null> {
  try {
    const snap = await getDocs(
      collection(getFirestoreDb(), "users", uid, sub),
    );
    return snap.size;
  } catch {
    return null;
  }
}

async function safeLatestDate(
  uid: string,
  sub: string,
  dateField: string,
): Promise<Date | null> {
  try {
    const q = query(
      collection(getFirestoreDb(), "users", uid, sub),
      orderBy(dateField, "desc"),
      limit(1),
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const ts = snap.docs[0].data()[dateField] as Timestamp | undefined;
    return ts?.toDate() ?? null;
  } catch {
    return null;
  }
}

export async function getStudentProgress(uid: string): Promise<StudentProgress> {
  const [
    workoutsTotal,
    libraryCount,
    subscriptionCount,
    participationCount,
    lastWorkoutAt,
    lastParticipationAt,
  ] = await Promise.all([
    safeCount(uid, "workouts"),
    safeCount(uid, "library"),
    safeCount(uid, "subscriptions"),
    safeCount(uid, "participations"),
    safeLatestDate(uid, "workouts", "completedAt"),
    safeLatestDate(uid, "participations", "joinedAt"),
  ]);

  const hasAnyData =
    workoutsTotal !== null ||
    libraryCount !== null ||
    subscriptionCount !== null ||
    participationCount !== null;

  if (!hasAnyData) return EMPTY;

  return {
    workoutsTotal,
    libraryCount,
    subscriptionCount,
    participationCount,
    lastWorkoutAt,
    lastParticipationAt,
    hasAnyData,
  };
}
