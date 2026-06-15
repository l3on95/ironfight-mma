import { test, expect } from "@playwright/test";
import { TEST_USERS, login } from "./helpers";

/**
 * Rollen-abhängiges Dashboard gegen die Emulatoren (braucht: npm run test:e2e).
 *
 * Die Rolle kommt aus dem Custom Claim (vom globalSetup serverseitig gesetzt):
 *   role === "trainer" | "admin"  → Trainer-Dashboard
 *   sonst                          → Schüler-/Athleten-Dashboard
 */

// Wie auth.spec.ts: träges dev-Compile + toPass-Login → größeres Zeitlimit.
test.describe.configure({ timeout: 90_000 });

test.describe("Rollen-Dashboard (Emulator)", () => {
  test("Athlet (role=user) sieht das Schüler-Dashboard", async ({ page }) => {
    await login(page, TEST_USERS.athlete);
    await expect(page.getByText(/Mein Training/)).toBeVisible();
    await expect(page.getByText(/Trainer-Dashboard/)).toHaveCount(0);
  });

  test("Coach (role=trainer) sieht das Trainer-Dashboard", async ({ page }) => {
    await login(page, TEST_USERS.coach);
    await expect(page.getByText(/Trainer-Dashboard/)).toBeVisible();
  });
});
