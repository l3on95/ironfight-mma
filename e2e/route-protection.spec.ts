import { test, expect } from "@playwright/test";

/**
 * Middleware-Routen-Schutz für NICHT eingeloggte Nutzer.
 *
 * Braucht KEINEN Emulator und KEIN Java — geprüft wird nur das Edge-Gate in
 * middleware.ts (kein `__session`-Cookie vorhanden):
 *   - /admin/*            → 404 (Existenz verbergen)
 *   - geschützte Bereiche → Redirect auf /login?next=<pfad>
 *   - öffentliche Seiten  → erreichbar
 *
 * Lauf ohne Java:  E2E_SKIP_SEED=1 npm run test:e2e:routes
 */

test.describe("Routen-Schutz (unauthentifiziert)", () => {
  test("versteckt den Admin-Bereich als 404", async ({ page }) => {
    const res = await page.goto("/admin");
    expect(res?.status()).toBe(404);
  });

  test("versteckt verschachtelte Admin-Routen als 404", async ({ page }) => {
    const res = await page.goto("/admin/users");
    expect(res?.status()).toBe(404);
  });

  test("leitet /dashboard auf /login mit Rückkehr-Ziel um", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
  });

  test("leitet geschützte Trainer-Routen auf /login um", async ({ page }) => {
    await page.goto("/trainer");
    await expect(page).toHaveURL(/\/login\?next=%2Ftrainer$/);
  });

  test("leitet /profile auf /login um", async ({ page }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/login\?next=%2Fprofile$/);
  });

  test("lässt die öffentliche Startseite zu", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.status()).toBeLessThan(400);
  });

  test("lässt die Login-Seite zu", async ({ page }) => {
    const res = await page.goto("/login");
    expect(res?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/login$/);
  });
});
