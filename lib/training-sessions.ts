/**
 * Firestore-Schema:
 *
 *   trainingSessions/{blockId}_{weekId}
 *     trainingBlockId  string
 *     weekIdentifier   string   ("2026-W19" — intern, nicht im UI)
 *     exerciseIds      string[]
 *     updatedAt        Timestamp
 *     updatedBy        string   (uid des Trainers)
 *
 *   users/{uid}/library/{exerciseId}   ← exerciseId = Document-ID → kein Duplikat möglich
 *     exerciseId       string
 *     source           "training" | "manual"
 *     trainingSessionId string | null
 *     contextLabel     string | null
 *     addedAt          Timestamp
 *
 *   users/{uid}/participations/{sessionId}
 *     trainingSessionId string
 *     trainingBlockId   string
 *     blockTitle        string
 *     weekIdentifier    string
 *     joinedAt          Timestamp
 *
 * Hinweis Firestore-Regeln: Die Collection `trainingSessions` muss
 *   read: allow if request.auth != null
 *   write: allow if get(/users/$(request.auth.uid)).data.role in ["trainer","admin"]
 * in der Firebase Console konfiguriert werden.
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { getFirestoreDb } from "./firebase";
import type { LibraryEntry, TrainingSession } from "./types";

// ─── Training Sessions ─────────────────────────────────────────────────────

function makeSessionId(blockId: string, weekId: string) {
  return `${blockId}_${weekId}`;
}

function sessionDocRef(blockId: string, weekId: string) {
  return doc(
    getFirestoreDb(),
    "trainingSessions",
    makeSessionId(blockId, weekId),
  );
}

/** Lädt eine Trainingseinheit für einen Block + Woche. Null wenn noch nicht angelegt. */
export async function getTrainingSession(
  blockId: string,
  weekId: string,
): Promise<TrainingSession | null> {
  const snap = await getDoc(sessionDocRef(blockId, weekId));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    id: snap.id,
    trainingBlockId: d.trainingBlockId,
    weekIdentifier: d.weekIdentifier,
    exerciseIds: d.exerciseIds ?? [],
    updatedAt: d.updatedAt?.toDate(),
    updatedBy: d.updatedBy,
  };
}

/**
 * Speichert Übungen für eine Trainingseinheit (Trainer-Aktion).
 * Erstellt die Session falls nötig.
 */
export async function setSessionExercises(
  blockId: string,
  weekId: string,
  exerciseIds: string[],
  updatedBy: string,
): Promise<TrainingSession> {
  const ref = sessionDocRef(blockId, weekId);
  await setDoc(
    ref,
    {
      trainingBlockId: blockId,
      weekIdentifier: weekId,
      exerciseIds,
      updatedAt: serverTimestamp(),
      updatedBy,
    },
    { merge: true },
  );
  return {
    id: makeSessionId(blockId, weekId),
    trainingBlockId: blockId,
    weekIdentifier: weekId,
    exerciseIds,
    updatedBy,
  };
}

// ─── Persönliche Bibliothek ────────────────────────────────────────────────

function libraryDocRef(uid: string, exerciseId: string) {
  return doc(getFirestoreDb(), "users", uid, "library", exerciseId);
}

function libraryColRef(uid: string) {
  return collection(getFirestoreDb(), "users", uid, "library");
}

/**
 * Fügt eine Übung zur persönlichen Bibliothek hinzu.
 * Da exerciseId = Document-ID, sind Duplikate strukturell ausgeschlossen.
 * Gibt `true` zurück wenn neu hinzugefügt, `false` wenn bereits vorhanden.
 */
export async function addToLibrary(
  uid: string,
  exerciseId: string,
  source: "training" | "manual",
  trainingSessionId?: string,
  contextLabel?: string,
): Promise<boolean> {
  const ref = libraryDocRef(uid, exerciseId);
  const existing = await getDoc(ref);
  if (existing.exists()) return false;

  await setDoc(ref, {
    exerciseId,
    source,
    trainingSessionId: trainingSessionId ?? null,
    contextLabel: contextLabel ?? null,
    addedAt: serverTimestamp(),
  });
  return true;
}

/**
 * Fügt alle Übungen einer Session zur Bibliothek hinzu.
 * Vollständig dedup-sicher. Gibt Anzahl neu hinzugefügter Übungen zurück.
 */
export async function addSessionExercisesToLibrary(
  uid: string,
  session: TrainingSession,
  contextLabel: string,
): Promise<number> {
  let added = 0;
  for (const exerciseId of session.exerciseIds) {
    const wasNew = await addToLibrary(
      uid,
      exerciseId,
      "training",
      session.id,
      contextLabel,
    );
    if (wasNew) added++;
  }
  return added;
}

/** Liest die gesamte Bibliothek des Users (absteigend nach Datum). */
export async function getLibrary(uid: string): Promise<LibraryEntry[]> {
  const q = query(libraryColRef(uid), orderBy("addedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      exerciseId: data.exerciseId as string,
      source: data.source as "training" | "manual",
      trainingSessionId: data.trainingSessionId ?? undefined,
      contextLabel: data.contextLabel ?? undefined,
      addedAt: (data.addedAt as Timestamp).toDate(),
    };
  });
}

/** Entfernt eine Übung aus der persönlichen Bibliothek. */
export async function removeFromLibrary(
  uid: string,
  exerciseId: string,
): Promise<void> {
  await deleteDoc(libraryDocRef(uid, exerciseId));
}

// ─── Teilnahmen ────────────────────────────────────────────────────────────

function participationDocRef(uid: string, sessionId: string) {
  return doc(getFirestoreDb(), "users", uid, "participations", sessionId);
}

/** Speichert eine Trainingsteilnahme. Idempotent — zweimaliges Klicken hat keinen Effekt. */
export async function recordParticipation(
  uid: string,
  session: TrainingSession,
  blockTitle: string,
): Promise<void> {
  const ref = participationDocRef(uid, session.id);
  const existing = await getDoc(ref);
  if (existing.exists()) return;

  await setDoc(ref, {
    trainingSessionId: session.id,
    trainingBlockId: session.trainingBlockId,
    blockTitle,
    weekIdentifier: session.weekIdentifier,
    joinedAt: serverTimestamp(),
  });
}

/** Prüft ob der User bereits an einer Session teilnimmt. */
export async function hasParticipated(
  uid: string,
  sessionId: string,
): Promise<boolean> {
  const snap = await getDoc(participationDocRef(uid, sessionId));
  return snap.exists();
}
