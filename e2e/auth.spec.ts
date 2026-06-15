import { test, expect } from "@playwright/test";
import { TEST_USERS, login } from "./helpers";

/**
 * Login-Fluss gegen die Firebase-Emulatoren (Auth + Firestore).
 *
 * Braucht den vollen Emulator-Lauf:  npm run test:e2e
 * Deckt ab: signIn → onAuthStateChanged → onIdTokenChanged (`__session`-Cookie)
 * → Middleware lässt /dashboard durch.
 */

// `next dev` kompiliert Seiten beim ersten Aufruf träge und der toPass-Login
// (Hydrations-Race) braucht u. U. mehrere Versuche → großzügigeres Test-Limit.
test.describe.configure({ timeout: 90_000 });

test.describe("Login (Emulator)", () => {
  test("loggt einen Athleten ein und landet auf dem Dashboard", async ({
    page,
  }) => {
    await login(page, TEST_USERS.athlete);
    await expect(page.getByText(/Mein Training/)).toBeVisible();
  });

  test("weist falsche Zugangsdaten ab und bleibt auf /login", async ({
    page,
  }) => {
    await page.goto("/login");
    // toPass deckt denselben Hydrations-Race ab wie der login()-Helper: vor der
    // Hydration macht der Klick einen nativen Submit (kein signIn, keine
    // Fehlermeldung). Nach der Hydration lehnt signIn die Zugangsdaten ab.
    await expect(async () => {
      await page.locator('input[type="email"]').fill(TEST_USERS.athlete.email);
      await page.locator('input[type="password"]').fill("falsch-falsch");
      await page.getByRole("button", { name: "Login", exact: true }).click();
      await expect(
        page.getByText(/Passwort falsch|Login fehlgeschlagen/),
      ).toBeVisible({ timeout: 5_000 });
    }).toPass({ timeout: 60_000 });

    await expect(page).toHaveURL(/\/login/);
  });

  test("hält die Session über einen Reload (Session-Cookie)", async ({
    page,
  }) => {
    await login(page, TEST_USERS.athlete);
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/Mein Training/)).toBeVisible();
  });
});
