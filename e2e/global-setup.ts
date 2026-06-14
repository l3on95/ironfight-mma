import type { FullConfig } from "@playwright/test";
import { initializeApp, getApps, deleteApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Playwright global setup — seedet deterministische Testnutzer in den
 * Auth-Emulator (inkl. Rollen-Custom-Claim) und legt die gespiegelten
 * `users/{uid}`-Dokumente im Firestore-Emulator an.
 *
 * Läuft NUR wenn die Emulatoren erreichbar sind. Beim reinen Routen-Schutz-Lauf
 * (`npm run test:e2e:routes`, ohne Java) wird via `E2E_SKIP_SEED=1` übersprungen.
 *
 * Die Rollen werden hier — wie in Produktion — ausschließlich serverseitig über
 * das Admin SDK als Custom Claim gesetzt; kein Client-Pfad schreibt `role`.
 */

const PROJECT_ID = "demo-ironfight";

export const E2E_USERS = [
  {
    email: "athlete@test.dev",
    password: "test1234",
    role: "user" as const,
    displayName: "Test Athlet",
  },
  {
    email: "coach@test.dev",
    password: "test1234",
    role: "trainer" as const,
    displayName: "Test Coach",
  },
];

export default async function globalSetup(_config: FullConfig) {
  if (process.env.E2E_SKIP_SEED === "1") {
    console.log("[e2e] E2E_SKIP_SEED=1 → Firebase-Seeding übersprungen");
    return;
  }

  // Admin SDK gegen die Emulatoren richten. `firebase emulators:exec` setzt
  // diese Hosts normalerweise selbst; als Fallback hart auf die konfigurierten
  // Ports zeigen.
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
  process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";

  const app = getApps().length
    ? getApps()[0]
    : initializeApp({ projectId: PROJECT_ID });
  const auth = getAuth(app);
  const db = getFirestore(app);

  for (const u of E2E_USERS) {
    let uid: string;
    try {
      uid = (await auth.getUserByEmail(u.email)).uid;
    } catch {
      uid = (
        await auth.createUser({
          email: u.email,
          password: u.password,
          displayName: u.displayName,
        })
      ).uid;
    }

    await auth.setCustomUserClaims(uid, { role: u.role });
    await db
      .collection("users")
      .doc(uid)
      .set(
        { displayName: u.displayName, email: u.email, role: u.role },
        { merge: true },
      );
  }

  await deleteApp(app);
  console.log(`[e2e] ${E2E_USERS.length} Testnutzer in die Emulatoren geseedet`);
}
