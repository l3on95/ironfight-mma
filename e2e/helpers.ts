import { expect, type Page } from "@playwright/test";

/** Vom globalSetup geseedete Emulator-Testnutzer. */
export const TEST_USERS = {
  athlete: { email: "athlete@test.dev", password: "test1234" },
  coach: { email: "coach@test.dev", password: "test1234" },
} as const;

/**
 * Loggt einen Nutzer per E-Mail/Passwort ein und wartet, bis das Dashboard
 * erreicht ist. Deckt damit gleich das Zusammenspiel signIn → onIdTokenChanged
 * (`__session`-Cookie) → Middleware-Freigabe ab.
 *
 * Warum `toPass`: Im `next dev` kann Playwright das Login-Formular abschicken,
 * BEVOR React hydriert ist. Dann greift `handleSubmit`/`preventDefault` noch
 * nicht und der Browser macht einen nativen GET-Submit (`/login?`), der die
 * Felder leert und `signIn` nie auslöst. `toPass` füllt + klickt erneut, bis der
 * hydrierte React-Pfad greift und die Self-Heal-Navigation auf `/dashboard`
 * durch ist (signIn → Cookie gesetzt → Middleware lässt durch).
 */
export async function login(
  page: Page,
  user: { email: string; password: string },
) {
  await page.goto("/login");
  await expect(async () => {
    await page.locator('input[type="email"]').fill(user.email);
    await page.locator('input[type="password"]').fill(user.password);
    await page.getByRole("button", { name: "Login", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 8_000 });
  }).toPass({ timeout: 60_000 });
}
