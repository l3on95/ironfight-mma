# Test Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up Vitest + Playwright testing for IronFight MMA, characterize then refactor the four lint-flagged hooks, add unit/component coverage, drive `npm run lint` to zero errors, and add emulator-backed E2E.

**Architecture:** Vitest (jsdom + Testing Library) for unit/component; characterization-first refactor of behavior-sensitive hooks using `useSyncExternalStore`; Playwright + Firebase emulator for E2E with a no-Java fallback to route-protection-only.

**Tech Stack:** Vitest, @testing-library/react + user-event + jest-dom, jsdom, vite-tsconfig-paths, @playwright/test, firebase-tools, firebase-admin.

**Spec:** `docs/superpowers/specs/2026-06-15-test-suite-design.md`

---

## File Structure

**Create**
- `vitest.config.ts`, `vitest.setup.ts`
- `lib/__tests__/use-workout-timer.test.ts`, `use-trainer-hints.test.ts`, `use-timer-settings.test.ts`, `theme-context.test.tsx`
- `lib/__tests__/fight-stats.test.ts`, `schedule.test.ts`, `workout-generator.test.ts`
- `components/__tests__/ProtectedRoute.test.tsx`, `TrainerHint.test.tsx`, `Quiz.test.tsx`
- `playwright.config.ts`, `e2e/global-setup.ts`, `e2e/route-protection.spec.ts`, `e2e/auth.spec.ts`, `e2e/dashboard.spec.ts`, `e2e/README.md`

**Modify**
- `package.json` (devDeps + scripts), `eslint.config.mjs` (`^_` ignore pattern)
- `lib/use-trainer-hints.ts`, `lib/use-timer-settings.ts`, `lib/theme-context.tsx`, `lib/use-workout-timer.ts` (refactors)
- `lib/firebase.ts` (emulator connect), `firebase.json` (emulators block)
- ~20 app pages + `components/trainer/{CompetitionCard,MatchupBlock}.tsx`, `components/PwaInstallPrompt.tsx`, `app/timer/page.tsx` (lint green)

---

## Phase 0 — Vitest infrastructure (Task #5)

### Task 0.1: Install deps + scripts

- [ ] **Step 1: Add dev deps**

Run:
```bash
npm i -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom vite-tsconfig-paths
```

- [ ] **Step 2: Add scripts to `package.json`**

```json
"test": "vitest run",
"test:watch": "vitest",
"test:e2e": "firebase emulators:exec --only auth,firestore 'playwright test'"
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["{lib,components,app}/**/__tests__/**/*.test.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**"],
  },
});
```

- [ ] **Step 4: Create `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 5: Smoke test** — create `lib/__tests__/smoke.test.ts` with `it("runs", () => expect(1).toBe(1))`, run `npm test`, expect PASS, then delete the smoke file.

- [ ] **Step 6: Commit** `chore(test): add vitest + testing-library harness`

---

## Phase 1 — Characterization tests for the 4 hooks (Task #6)

**Rule:** pin the **observable contract** (settled values, transitions, side-effect calls) — NOT transient first-render internals (e.g. the old `useState(true)` initial that an effect overwrites). The refactor must keep these green.

### Task 1.1: `use-workout-timer.test.ts`

Mock audio first:
```ts
import { renderHook, act } from "@testing-library/react";
import { vi, beforeEach, afterEach, describe, it, expect } from "vitest";

vi.mock("@/lib/audio", () => ({
  playRoundStart: vi.fn(), playRoundEnd: vi.fn(), playSessionEnd: vi.fn(),
  playCountdownTick: vi.fn(), vibrateTick: vi.fn(), vibrateRoundEnd: vi.fn(), vibrateSessionEnd: vi.fn(),
}));
import * as audio from "@/lib/audio";
import { useWorkoutTimer } from "@/lib/use-workout-timer";

beforeEach(() => { vi.useFakeTimers(); vi.clearAllMocks(); });
afterEach(() => { vi.useRealTimers(); });

// helper: advance wall clock AND the 200ms interval together
function advance(ms: number) { act(() => { vi.advanceTimersByTime(ms); }); }
```

Behavioral checklist (one `it` each):
- initial: `phase==="idle"`, `round===1`, `remaining===180` (DEFAULT.workSeconds), `running===false`.
- `start()` from idle → `phase==="prep"`, `running===true`, `remaining===prepSeconds` (10).
- advancing prep to 0 → `phase==="work"`, `round===1`, `playRoundStart` called.
- work→ at `left===4` in **prep** the countdown fires once: `playCountdownTick` + `vibrateTick` called exactly once across the phase (advance past 4s boundary, assert `toHaveBeenCalledTimes(1)`).
- work to 0 with `round < rounds` → `phase==="rest"`, `playRoundEnd` + `vibrateRoundEnd` called.
- rest to 0 → `phase==="work"`, `round===2`.
- final work (`round===rounds`) to 0 → `phase==="done"`, `running===false`, `playSessionEnd` + `vibrateSessionEnd` called.
- `remaining` counts down: use a small config `{rounds:1, workSeconds:5, restSeconds:3, prepSeconds:2}`, start, advance 1000ms, assert `remaining===1` during prep.
- `pause()` → `running===false` and `remaining` frozen across further advances.
- `reset()` → `phase==="idle"`, `round===1`, `remaining===config.workSeconds`.
- `skip()` from work (round < rounds) → `phase==="rest"`; from prep → `work`.
- **idle-derived (guards the refactor):** with phase idle, call `setConfig({...DEFAULT, workSeconds: 99})` → `remaining===99`.

- [ ] Write, run `npm test -- use-workout-timer`, expect all PASS against current code. Commit `test(timer): characterize useWorkoutTimer`.

### Task 1.2: `use-trainer-hints.test.ts`

```ts
import { renderHook, act } from "@testing-library/react";
import { useTrainerHint, resetAllTrainerHints } from "@/lib/use-trainer-hints";
beforeEach(() => { localStorage.clear(); });
```
Checklist:
- fresh id → settled `seen===false` (nothing stored). (Assert after render; do not assert the transient initial.)
- stored `ta:trainer-hint:x` = "1" before render → `seen===true`.
- `dismiss()` → writes `localStorage["ta:trainer-hint:x"]==="1"` and `seen===true`.
- `resetAllTrainerHints()` removes only `ta:trainer-hint:*` keys (seed an unrelated key, assert it survives).

Run, expect PASS, commit `test(hints): characterize useTrainerHint`.

### Task 1.3: `use-timer-settings.test.ts`

```ts
vi.mock("@/lib/audio", () => ({ setAudioMuted: vi.fn(), setVibrationEnabled: vi.fn() }));
import * as audio from "@/lib/audio";
import { useTimerSettings } from "@/lib/use-timer-settings";
beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); });
```
Checklist:
- defaults `{soundOn:true, vibrate:true, wakeLock:true}` when storage empty.
- reads persisted partial JSON merged over DEFAULT.
- on mount, `setAudioMuted(false)` + `setVibrationEnabled(true)` called (from persisted/default).
- `setSoundOn(false)` → persists to `ironfight.timer.settings.v1`, `settings.soundOn===false`, `setAudioMuted(true)` called.
- `setVibrate(false)` → `setVibrationEnabled(false)` called.

Run, expect PASS, commit `test(settings): characterize useTimerSettings`.

### Task 1.4: `theme-context.test.tsx`

```ts
import { renderHook, act } from "@testing-library/react";
import { ThemeProvider, useTheme } from "@/lib/theme-context";
const wrapper = ({ children }: { children: React.ReactNode }) => <ThemeProvider>{children}</ThemeProvider>;
beforeEach(() => { localStorage.clear(); document.documentElement.removeAttribute("data-theme"); });
```
Checklist:
- default theme `"dark"` (no storage).
- storage `ta-theme="light"` → settled `theme==="light"` and `data-theme==="light"`.
- `toggleTheme()` flips dark→light, persists `ta-theme`, sets `data-theme`.

Run, expect PASS, commit `test(theme): characterize ThemeProvider`.

---

## Phase 2 — Refactor the 4 hooks (Task #7)

Each refactor: apply the target code, run that hook's test (`npm test -- <name>`) — must stay GREEN, then `npx eslint <file>` — must be clean. Commit per hook.

### Task 2.1: `lib/use-trainer-hints.ts`

Replace the `useState` + `useEffect` with `useSyncExternalStore`:
```ts
"use client";
import { useCallback, useSyncExternalStore } from "react";

const STORAGE_PREFIX = "ta:trainer-hint:";
function storageKey(id: string) { return `${STORAGE_PREFIX}${id}`; }
function readSeen(id: string): boolean {
  if (typeof window === "undefined") return true;
  try { return window.localStorage.getItem(storageKey(id)) === "1"; } catch { return false; }
}
function writeSeen(id: string) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(storageKey(id), "1"); } catch {}
}
const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => { if (!e.key || e.key.startsWith(STORAGE_PREFIX)) cb(); };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => { listeners.delete(cb); if (typeof window !== "undefined") window.removeEventListener("storage", onStorage); };
}
function emit() { listeners.forEach((l) => l()); }

export function useTrainerHint(id: string): { seen: boolean; dismiss: () => void } {
  const seen = useSyncExternalStore(subscribe, () => readSeen(id), () => true);
  const dismiss = useCallback(() => { writeSeen(id); emit(); }, [id]);
  return { seen, dismiss };
}

export function resetAllTrainerHints() {
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
    emit();
  } catch {}
}
```
Test stays green; eslint clean. Commit `refactor(hints): useSyncExternalStore, clear set-state-in-effect`.

### Task 2.2: `lib/theme-context.tsx`

`theme` from store; a single effect syncs the DOM attribute:
```ts
"use client";
import { createContext, useCallback, useContext, useEffect, useSyncExternalStore, ReactNode } from "react";
type Theme = "dark" | "light";
interface ThemeContextValue { theme: Theme; toggleTheme: () => void; }
const ThemeContext = createContext<ThemeContextValue>({ theme: "dark", toggleTheme: () => {} });

function readTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try { const s = localStorage.getItem("ta-theme"); return s === "light" || s === "dark" ? s : "dark"; }
  catch { return "dark"; }
}
const listeners = new Set<() => void>();
function subscribe(cb: () => void) { listeners.add(cb); return () => listeners.delete(cb); }
function emit() { listeners.forEach((l) => l()); }

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "dark");
  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);
  const toggleTheme = useCallback(() => {
    const next: Theme = readTheme() === "dark" ? "light" : "dark";
    try { localStorage.setItem("ta-theme", next); } catch {}
    emit();
  }, []);
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}
export function useTheme() { return useContext(ThemeContext); }
```
Note: the DOM-attribute write in an effect is the legitimate "sync external system" use — not flagged by `set-state-in-effect`. Test green; eslint clean. Commit `refactor(theme): useSyncExternalStore + DOM-sync effect`.

### Task 2.3: `lib/use-timer-settings.ts`

Object snapshot must be memoized by raw string (stable reference) to avoid render loops; audio side-effects move to an effect keyed on `settings`:
```ts
"use client";
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { setAudioMuted, setVibrationEnabled } from "./audio";

export interface TimerSettings { soundOn: boolean; vibrate: boolean; wakeLock: boolean; }
const STORAGE_KEY = "ironfight.timer.settings.v1";
const DEFAULT: TimerSettings = { soundOn: true, vibrate: true, wakeLock: true };

let cachedRaw: string | null = null;
let cachedValue: TimerSettings = DEFAULT;
function getSnapshot(): TimerSettings {
  if (typeof window === "undefined") return DEFAULT;
  let raw: string | null = null;
  try { raw = window.localStorage.getItem(STORAGE_KEY); } catch { return cachedValue; }
  if (raw === cachedRaw) return cachedValue;
  cachedRaw = raw;
  try { cachedValue = raw ? { ...DEFAULT, ...(JSON.parse(raw) as Partial<TimerSettings>) } : DEFAULT; }
  catch { cachedValue = DEFAULT; }
  return cachedValue;
}
const listeners = new Set<() => void>();
function subscribe(cb: () => void) { listeners.add(cb); return () => listeners.delete(cb); }
function emit() { listeners.forEach((l) => l()); }

export function useTimerSettings() {
  const settings = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT);
  useEffect(() => { setAudioMuted(!settings.soundOn); setVibrationEnabled(settings.vibrate); }, [settings]);
  const update = useCallback((patch: Partial<TimerSettings>) => {
    const next = { ...getSnapshot(), ...patch };
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    emit();
  }, []);
  return {
    settings,
    setSoundOn: (v: boolean) => update({ soundOn: v }),
    setVibrate: (v: boolean) => update({ vibrate: v }),
    setWakeLock: (v: boolean) => update({ wakeLock: v }),
  };
}
```
Test green; eslint clean. Commit `refactor(settings): useSyncExternalStore + audio-sync effect`.

### Task 2.4: `lib/use-workout-timer.ts`

Only the idle derived-state effect (lines 163-165) is flagged. Remove it; make `setConfig` update `remaining` when idle via `phaseRef`:
- Delete:
```ts
useEffect(() => {
  if (phase === "idle") setRemaining(config.workSeconds);
}, [config.workSeconds, phase]);
```
- Rename the state setter and wrap it:
```ts
const [config, setConfigState] = useState<TimerConfig>(initial);
// ...
const setConfig = useCallback((c: TimerConfig) => {
  setConfigState(c);
  if (phaseRef.current === "idle") setRemaining(c.workSeconds);
}, []);
```
- Return `setConfig` (the wrapped one) unchanged in the return object.

Test green (incl. the idle-derived test); eslint clean. Commit `refactor(timer): drop idle set-state-in-effect, derive in setConfig`.

---

## Phase 3 — Pure-logic unit tests (Task #8)

Read each module first; write behavioral tests covering branches. No mocks needed (pure functions). For `schedule`, pass explicit `Date` args (it accepts injectable dates).

- [ ] `lib/__tests__/fight-stats.test.ts` — cover each exported fn: `dnaSplitTotal`, `normalizeDnaSplit`, `cleanDnaSplit`, `successRate` (incl. divide-by-zero → 0), `hasActionData`, `cleanActionStats`, `isActionStatsEmpty`, `actionTotals`, `statsByGroup`, `zoneDistribution`, `deriveTendencies`, `deriveSuggestions`, `actionLabel`. At least one happy-path + one edge (empty/zero) per fn. Commit.
- [ ] `lib/__tests__/schedule.test.ts` — `getWeekIdentifier(new Date("2026-06-15"))` deterministic; `getCurrentWeekday`/`getBlocksForDay` for each weekday branch (inject date). Commit.
- [ ] `lib/__tests__/workout-generator.test.ts` — `generateWorkout(input)` for representative inputs; assert structure/lengths/required fields. Commit.

(Read the actual signatures before writing — do not invent fields. Ground every assertion in the real return shape.)

---

## Phase 4 — Component tests (Task #9)

### Task 4.1: `components/__tests__/ProtectedRoute.test.tsx`
Mock `useAuth`:
```ts
vi.mock("@/lib/auth-context", () => ({ useAuth: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
import { useAuth } from "@/lib/auth-context";
```
- loading → renders a skeleton (no children).
- `!user` → does not render children (login-required UI).
- `user` present → renders children.
Commit.

### Task 4.2: `components/__tests__/TrainerHint.test.tsx`
Mock `useAuth` (role) and `@/lib/use-trainer-hints`:
- non-trainer (`profile.role==="user"`) → renders nothing.
- trainer + `seen===false` → renders title/children + "Verstanden" button.
- trainer + `seen===true` → renders nothing.
- clicking "Verstanden" calls `dismiss`.
Commit.

### Task 4.3: `components/__tests__/Quiz.test.tsx` (real state, user-event)
Use a 2-question fixture. Cover: submit disabled until all answered; select answers; submit → shows score `x / 2` and per-question ✓/✗ + explanations; "Nochmal versuchen" resets. Commit.

---

## Phase 5 — Full lint green: mechanical (Task #10)

Per file, apply fix, then `npx eslint <file>` clean + `npx tsc --noEmit` clean. Group commits sensibly.

- [ ] **`eslint.config.mjs`** — add ignore pattern so intentional `_`-prefixed vars stop warning:
```js
{
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
  },
},
```
Remove genuinely-dead imports (`updateDoc` in `lib/extensions/technique-progress.ts`). Commit.
- [ ] **`no-unescaped-entities` (8)** — in `app/profile`, `app/library`, `app/schedule`, `app/workout/generator`, `components/PwaInstallPrompt`: escape literal `"`/`'` in JSX text with `&quot;`/`&rsquo;` etc. (text only — never touch attribute strings). Commit.
- [ ] **`react-hooks/purity` (5)** — `Date.now()` in render in `components/trainer/CompetitionCard.tsx:44`, `MatchupBlock.tsx:118`, `app/profile/page.tsx`, `app/trainer/competitions/new/page.tsx`, `app/trainer/students/[uid]/page.tsx`: capture once via `const [now] = useState(() => Date.now());` (or module-scope arg) and use `now`. Verify the countdown still renders the same value. Commit.
- [ ] **`react-hooks/static-components` (4)** in `app/timer/page.tsx` — hoist inner component definitions to module scope, passing needed values as props. Run the app's timer test path mentally + `next build`. Commit.

---

## Phase 6 — Full lint green: app-page set-state-in-effect (Task #11)

~25 errors across ~20 pages. **Per file**: read it, classify the flagged `setState`, apply the minimal behavior-preserving transform:
- **Derived-state-in-effect** (setState mirrors props/other state) → compute during render, delete the effect.
- **Mount-read-from-store** → `useSyncExternalStore` (same pattern as Phase 2).
- If neither is safely verifiable for a given page → scoped `// eslint-disable-next-line react-hooks/set-state-in-effect` + one-line justification + a backlog note (documented exception per spec §7b).

**Gate (no per-page unit tests):** `npx tsc --noEmit` clean + `npx eslint <file>` clean + `next build` passes for the batch + careful diff review. Commit in small batches (e.g. by area: admin, auth, trainer, workout, dashboard/library/schedule).

Files: `app/dashboard`, `app/library`, `app/schedule`, `app/profile`, `app/login`, `app/register`, `app/admin/seed`, `app/admin/users`, `app/workout`, `app/workout/session`, `app/workout/generator`, `app/trainer`, `app/trainer/students`, `app/trainer/students/[uid]`, `app/trainer/competitions`, `app/trainer/competitions/new`, `app/trainer/competitions/[uid]/[campId]`, `app/trainer/opponents/[id]`, `app/timer` (remaining set-state cases), `components/PwaInstallPrompt`.

Final: `npx eslint .` → **0 errors**. Commit.

---

## Phase 7 — Playwright + Firebase emulator infra (Task #12)

### Task 7.1: Prereqs (no-sudo)
- [ ] Install firebase CLI as devDep: `npm i -D firebase-tools firebase-admin@^14` (firebase-admin already present).
- [ ] Install Playwright runner: `npm i -D @playwright/test` (Chromium binaries already cached — do NOT re-download; if needed `npx playwright install chromium`).
- [ ] **Attempt no-sudo JDK:** download a portable OpenJDK (Temurin/Adoptium) tarball into `$HOME/.local/jdk`, prepend to PATH, verify `java -version`. If the download or extract fails, record the failure and switch to the **fallback** (Phase 8 route-protection-only).

### Task 7.2: Config files
- [ ] `firebase.json` — add:
```json
"emulators": {
  "auth": { "port": 9099 },
  "firestore": { "port": 8080 },
  "ui": { "enabled": false },
  "singleProjectMode": true
}
```
- [ ] `lib/firebase.ts` — after creating auth/db, gate emulator wiring:
```ts
let _emulatorsWired = false;
function wireEmulators(auth: Auth, db: Firestore) {
  if (_emulatorsWired) return;
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true") {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    _emulatorsWired = true;
  }
}
```
Call `wireEmulators` once from `getFirebaseAuth`/`getFirestoreDb` (import `connectAuthEmulator`, `connectFirestoreEmulator`). Prod path unaffected (env unset).
- [ ] `playwright.config.ts`:
```ts
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  use: { baseURL: "http://127.0.0.1:3000" },
  webServer: {
    command: "next dev -p 3000",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
    env: {
      NEXT_PUBLIC_USE_FIREBASE_EMULATOR: "true",
      NEXT_PUBLIC_FIREBASE_API_KEY: "demo",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "ironfight-mma",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "ironfight-mma.firebaseapp.com",
      NEXT_PUBLIC_FIREBASE_APP_ID: "demo",
    },
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
```
- [ ] `e2e/global-setup.ts` — seed users via firebase-admin against the Auth emulator:
```ts
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
export default async function globalSetup() {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
  const app = initializeApp({ projectId: "ironfight-mma" });
  const auth = getAuth(app);
  for (const u of [
    { email: "athlete@test.dev", password: "test1234", role: "user" },
    { email: "coach@test.dev", password: "test1234", role: "trainer" },
  ]) {
    const rec = await auth.createUser({ email: u.email, password: u.password }).catch(() => auth.getUserByEmail(u.email));
    await auth.setCustomUserClaims(rec.uid, { role: u.role });
  }
}
```
Commit infra `chore(e2e): playwright + firebase emulator wiring`.

---

## Phase 8 — E2E specs (Task #13)

### Task 8.1: `e2e/route-protection.spec.ts` (ALWAYS runs — no Java/emulator)
Run with `MIDDLEWARE_AUTH` on and no session cookie:
```ts
import { test, expect } from "@playwright/test";
test("admin hidden as 404 when unauthenticated", async ({ page }) => {
  const res = await page.goto("/admin");
  expect(res?.status()).toBe(404);
});
test("protected route redirects to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
});
test("public route is reachable", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBeLessThan(400);
});
```
Note: this spec needs only `next dev` — runnable even without the emulator. If running standalone (no `emulators:exec`), add a `test:e2e:routes` script: `playwright test route-protection.spec.ts`.

### Task 8.2: `e2e/auth.spec.ts` (needs emulator)
Register a new athlete, then verify dashboard reachable; log in as seeded `athlete@test.dev` and assert redirect to `/dashboard`. Use real form selectors from `app/register/page.tsx` + `app/login/page.tsx` (read them first; ground selectors in actual markup).

### Task 8.3: `e2e/dashboard.spec.ts` (needs emulator)
As seeded athlete, perform an authenticated data flow that the dashboard supports (e.g. log a workout, reload, assert it appears). Ground in the actual dashboard UI.

### Task 8.4: `e2e/README.md`
Document: emulator needs a JDK; `npm run test:e2e` runs the full suite via `firebase emulators:exec`; route-protection runs standalone. If the JDK install failed, note specs 8.2/8.3 are committed ready-to-run but were not executed this run.

Run what's possible: if JDK OK → `npm run test:e2e` (all). Else → route-protection only. Commit.

---

## Phase 9 — Verify + expand (Task #14)
- [ ] `npm test` green; `npx tsc --noEmit` clean; `npx eslint .` → 0 errors; `next build` passes; route-protection E2E green (+ auth/data if JDK).
- [ ] Push everything to `chore/upgrade-next-16`.
- [ ] If time remains: add high-value tests (more pure modules, more components — e.g. `lib/quiz-data` consumers, additional `lib/` utilities). Each well-scoped, grounded in real signatures.
- [ ] Write a final summary: what ran vs deferred (esp. E2E/Java outcome), commit count, lint before/after.

---

## Self-Review notes
- Spec §4–§10 each map to a phase above (infra→0, characterize→1, refactor→2, pure→3, component→4, lint green→5/6, E2E→7/8, verify→9).
- Hook refactor target code is complete and type-consistent (`setConfig` wraps `setConfigState`; `getSnapshot`/`subscribe`/`emit` defined per hook).
- Characterization tests pin **settled** behavior so the Phase-2 refactor keeps them green (transient first-render internals deliberately not pinned).
- The one allowed exception path (scoped `eslint-disable` + backlog note) is documented for Phase 6 pages that can't be safely verified.
