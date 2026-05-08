/**
 * Admin-Funktionen — nur für Nutzer mit role = "admin" aufrufbar.
 * Firestore-Regeln erzwingen dies serverseitig.
 */

import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { getFirestoreDb } from "./firebase";
import type { UserRole } from "./types";

export type AdminUserEntry = {
  uid: string;
  email: string | null;
  displayName: string | null;
  authProviderName: string | null;
  role: UserRole | undefined;
  createdAt: Date | undefined;
};

/** Lädt alle registrierten Nutzer (absteigend nach Registrierungsdatum). */
export async function listAllUsers(): Promise<AdminUserEntry[]> {
  const q = query(
    collection(getFirestoreDb(), "users"),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      uid: d.id,
      email: data.email ?? null,
      displayName: data.displayName ?? null,
      authProviderName: data.authProviderName ?? null,
      role: data.role as UserRole | undefined,
      createdAt: data.createdAt?.toDate() as Date | undefined,
    };
  });
}

/** Setzt die Rolle eines Nutzers. */
export async function setUserRole(uid: string, role: UserRole): Promise<void> {
  await updateDoc(doc(getFirestoreDb(), "users", uid), { role });
}
