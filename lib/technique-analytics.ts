/**
 * Anonyme, aggregierte Technik-Aufruf-Statistiken.
 *
 * Firestore-Schema:
 *   techniqueStats/{techniqueId}
 *     viewCount   number   — rein aggregierter Zähler, kein User-Bezug
 *     lastViewed  Timestamp
 *
 * Datenschutz: Es werden keine User-IDs, Sitzungen oder personenbezogenen
 * Daten gespeichert — nur ein globaler Zähler pro Technik-ID.
 * Firestore-Regeln: read → trainer/admin; write → alle authentifizierten Nutzer
 * (increment-only über FieldValue.increment, kein Set/Delete).
 */

import {
  collection,
  doc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getFirestoreDb } from "./firebase";

export type TechniqueStatEntry = {
  id: string;
  viewCount: number;
};

/** Inkrementiert den anonymen Aufruf-Zähler einer Technik. Fire-and-forget. */
export async function recordTechniqueView(techniqueId: string): Promise<void> {
  const ref = doc(getFirestoreDb(), "techniqueStats", techniqueId);
  await setDoc(
    ref,
    { viewCount: increment(1), lastViewed: serverTimestamp() },
    { merge: true },
  );
}

/** Lädt die meistangesehenen Techniken (aggregiert, anonym). */
export async function getTopTechniques(
  limitCount = 10,
): Promise<TechniqueStatEntry[]> {
  const q = query(
    collection(getFirestoreDb(), "techniqueStats"),
    orderBy("viewCount", "desc"),
    limit(limitCount),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    viewCount: d.data().viewCount as number,
  }));
}
