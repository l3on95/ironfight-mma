import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright-E2E-Konfiguration.
 *
 * Zwei Laufmodi:
 *   1. Voll (Auth + Daten):  `npm run test:e2e`
 *      → `firebase emulators:exec` startet Auth+Firestore-Emulator, wrappt
 *        `playwright test`. Braucht ein JDK (siehe e2e/README.md). globalSetup
 *        seedet Testnutzer in den Auth-Emulator.
 *   2. Nur Routen-Schutz:    `npm run test:e2e:routes`
 *      → braucht KEIN Java/keinen Emulator. Prüft nur das Middleware-Gate
 *        (404 für /admin, Redirect für geschützte Seiten). globalSetup
 *        überspringt das Seeding via `E2E_SKIP_SEED=1`.
 *
 * Der dev-Server bekommt Demo-Firebase-Config + das Emulator-Flag injiziert,
 * damit der Browser-Client gegen die Emulatoren spricht statt gegen die Cloud.
 */

const PORT = 3000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

// Demo-Projekt ("demo-"-Präfix → Firebase läuft voll offline, keine echten
// Credentials nötig). Diese Werte landen NUR im Test-dev-Server, nie in Prod.
const firebaseEnv: Record<string, string> = {
  NEXT_PUBLIC_USE_FIREBASE_EMULATOR: "true",
  NEXT_PUBLIC_FIREBASE_API_KEY: "demo-api-key",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "demo-ironfight.firebaseapp.com",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-ironfight",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "demo-ironfight.appspot.com",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "0",
  NEXT_PUBLIC_FIREBASE_APP_ID: "demo-app-id",
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"]],
  globalSetup: "./e2e/global-setup.ts",
  timeout: 30_000,
  expect: { timeout: 7_500 },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    actionTimeout: 10_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "next dev -p 3000",
    url: BASE_URL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: firebaseEnv,
  },
});
