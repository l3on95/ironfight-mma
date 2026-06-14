# Test Suite Design — IronFight MMA

**Date:** 2026-06-15
**Branch:** `chore/upgrade-next-16`
**Status:** Approved (overnight autonomous run authorized)

## 1. Goal

The repo has **zero tests**. The Next 16 upgrade introduced stricter
`react-hooks` lint rules that flag **46 errors across 26 files** — much of it in
behavior-sensitive code with no safety net. This project:

1. Stands up a **Vitest** unit/component test harness.
2. Writes **characterization tests** that pin the current behavior of the four
   flagged hooks, then **refactors them to clear lint** with tests guarding
   behavior.
3. Adds **pure-logic** and **component** test coverage.
4. Drives `npm run lint` to **zero errors** ("full green"), including the
   app-page `set-state-in-effect` cases.
5. Stands up **Playwright** E2E for route protection plus emulator-backed
   auth/data flows.

## 2. Settled decisions (from scoping)

| Decision | Choice |
|---|---|
| Refactor sequencing | **Characterize first, then refactor** (tests are the net) |
| Lint scope | **Attempt full green** — all 46 errors, including app pages |
| E2E + Java (emulator needs a JDK; none installed) | **Try a no-sudo portable JDK + firebase-tools; if it fails, deliver all E2E code ready-to-run and run only the no-emulator route-protection spec** |
| Git | **Commit + push per accepted change to `chore/upgrade-next-16`; no PR** |
| Leftover time | **Expand coverage** (high-value pure modules/components first) |

## 3. Lint inventory (ground truth — `npx eslint .`)

**46 errors / 26 files + 12 warnings.**

| Rule | Errors | Nature | Risk |
|---|---|---|---|
| `react-hooks/set-state-in-effect` | 29 | 4 in target hooks, ~25 in app pages | Behavior-sensitive |
| `react/no-unescaped-entities` | 8 | German UI text with `"`/`'` | Mechanical |
| `react-hooks/purity` | 5 | `Date.now()` called during render | Low |
| `react-hooks/static-components` | 4 | component defined inside component (`app/timer`) | Low–medium |
| `@typescript-eslint/no-unused-vars` | 0 (12 warn) | incl. `_`-prefixed intentional params | Mechanical |
| `@next/next/no-img-element` | 0 (1 warn) | `<img>` in `PwaInstallPrompt` | Mechanical |

`npm run lint` (`eslint .`) exits non-zero on **errors** only. "Full green" =
**0 errors**. Warnings are cleaned opportunistically (see §7).

Files with errors (by count): `app/timer/page.tsx` (7), `app/profile/page.tsx`
(5), `app/trainer/competitions/new/page.tsx` (3),
`components/PwaInstallPrompt.tsx` (3), `app/dashboard`, `app/library`,
`app/schedule`, `app/trainer/students/[uid]`, `app/trainer/students`,
`app/workout/generator` (2 each), and 16 files with 1 each
(`app/admin/seed`, `app/admin/users`, `app/login`, `app/register`,
`app/trainer/competitions/[uid]/[campId]`, `app/trainer/competitions`,
`app/trainer/opponents/[id]`, `app/trainer`, `app/workout`,
`app/workout/session`, `components/trainer/CompetitionCard`,
`components/trainer/MatchupBlock`, `lib/theme-context`,
`lib/use-timer-settings`, `lib/use-trainer-hints`, `lib/use-workout-timer`).

## 4. Vitest infrastructure

- **Deps (dev):** `vitest`, `@testing-library/react`, `@testing-library/user-event`,
  `@testing-library/jest-dom`, `jsdom`, `vite-tsconfig-paths`.
- **`vitest.config.ts`:** `environment: "jsdom"`, `globals: true`,
  `setupFiles: ["./vitest.setup.ts"]`, `plugins: [tsconfigPaths()]` for the `@/`
  alias. Exclude `e2e/**` and `node_modules` from the Vitest run.
- **`vitest.setup.ts`:** import `@testing-library/jest-dom/vitest`; rely on
  Testing Library auto-cleanup.
- **Scripts:** `"test": "vitest run"`, `"test:watch": "vitest"`,
  `"test:e2e": "<playwright invocation, see §8>"`.
- **Mocks:**
  - `./audio` — no Web Audio in jsdom; `vi.mock("@/lib/audio")` (or relative)
    with `vi.fn()` spies, so the timer hook's sound/vibration calls are asserted,
    not executed.
  - `@/lib/firebase` — mocked in component tests that transitively import it.
  - Timer hook uses `vi.useFakeTimers()` (it relies on `Date.now()` +
    `window.setInterval`).
- **Layout:** co-locate under `__tests__/`:
  `lib/__tests__/*.test.ts(x)`, `components/__tests__/*.test.tsx`.

## 5. Characterization tests (pin current behavior, then refactor)

Written **green against current code first**, so the subsequent refactor is
guarded.

- **`use-workout-timer`** — `renderHook` + fake timers. Cover: idle→prep on
  `start`; prep→work→rest→work cycling; `round` increments; `done` after final
  round; `remaining` countdown via `Date.now()` advance; countdown tick fires
  **once** at `left === 4` in `rest`/`prep`; `playRoundStart`/`playRoundEnd`/
  `playSessionEnd`/`playCountdownTick`/`vibrate*` called at the right edges;
  `pause`/`reset`/`skip`; `remaining` tracks `config.workSeconds` while idle.
- **`use-trainer-hints`** — initial `seen === true` (no-flash); reads
  `localStorage` after mount; `dismiss` writes `ta:trainer-hint:<id>` = `"1"`
  and sets `seen`; `resetAllTrainerHints` clears only prefixed keys.
- **`use-timer-settings`** — defaults `{soundOn,vibrate,wakeLock: true}`; reads
  persisted JSON; `update` persists to `ironfight.timer.settings.v1` and calls
  `setAudioMuted(!soundOn)` / `setVibrationEnabled(vibrate)`.
- **`theme-context`** — default `dark`; reads `ta-theme`; `toggleTheme` flips
  value, persists, and sets `document.documentElement[data-theme]`.

## 6. Hook refactor (clears the 4 hook errors)

The flagged pattern — *read an external store on mount and `setState`* — is
exactly what `useSyncExternalStore` is for.

- **`use-trainer-hints`** → `useSyncExternalStore(subscribe, () => readSeen(id),
  () => true)`. Server snapshot `true` preserves no-flash SSR. The mount effect
  disappears. `dismiss` notifies subscribers.
- **`use-timer-settings`** → `useSyncExternalStore` for the persisted value;
  a **separate** `useEffect` keyed on `settings` pushes
  `setAudioMuted`/`setVibrationEnabled` to the audio subsystem (a genuine
  external side-effect, not derived state).
- **`theme-context`** → `useSyncExternalStore` for the theme; effect only syncs
  the `data-theme` DOM attribute.
- **`use-workout-timer`** → the `phase === "idle"` effect (line 163-165) sets
  *derived state* (`remaining` is just `config.workSeconds` when idle); fold it
  into `reset`/`enterPhase`/`setConfig` so no effect sets it. The `setInterval`
  effect is a legitimate timer; if the rule still flags it, isolate the tick so
  the exception is contained and documented — not papered over with a blanket
  disable. Exact shape settled during implementation **under green tests**.

## 7. Full lint green

### 7a. Mechanical (low behavior risk)
- **`no-unescaped-entities` (8)** — escape `"`/`'` in JSX text (`&quot;` /
  `&ldquo;` / `&rsquo;` etc.). No behavior change.
- **`react-hooks/purity` (5)** — `Date.now()` in render (`CompetitionCard`,
  `MatchupBlock`, profile/trainer pages). Capture "now" once via lazy
  `useState(() => Date.now())` (or compute in an effect/event) so render is
  pure. Behavior equivalent for a countdown rendered once.
- **`react-hooks/static-components` (4, `app/timer`)** — hoist the
  component(s) defined inside the page component to module scope (pass props
  instead of closing over). Behavior equivalent.
- **`no-unused-vars` (warn)** — add `argsIgnorePattern`/`varsIgnorePattern:
  "^_"` to `eslint.config.mjs` for intentional `_freq`/`_ms`/`_pattern`; remove
  genuinely-dead imports (`updateDoc`).
- **`no-img-element` (warn)** — non-blocking; convert to `next/image` if clean,
  else leave as a warning (does not fail lint).

### 7b. Behavior-sensitive — app-page `set-state-in-effect` (~25 across ~20 files)
No full-page test coverage is feasible (Firestore-bound pages). Strategy:
**inspect each, apply the minimal behavior-preserving transform**:
- Derived-state-in-effect → lift the computation to render (the canonical
  "you might not need an effect" fix).
- Mount-read-from-external-store → `useSyncExternalStore`.
- Genuinely async data fetch already in a `.then`/`async` callback is **not**
  flagged; only synchronous body `setState` is. Where a synchronous initial
  `setState` mirrors a prop/derived value, lift it.

**Gate for this group:** `tsc --noEmit` clean + `next build` passes + careful
per-file diff review. If any single page cannot be refactored without behavior
risk that can't be verified, it is left with a **scoped, commented
`eslint-disable-next-line` + a backlog note** rather than a guessed refactor.
This is the one place "full green" may carry a documented exception.

## 8. Playwright + Firebase emulator

- **Prereqs:** Chromium is already in the Playwright cache. **Java is absent**
  and the Firebase emulators require a JDK. Attempt a **no-sudo** portable
  OpenJDK (download tarball to `$HOME`, prepend `PATH`) + `firebase-tools`
  (devDep, no sudo). If either fails → **fallback** (below).
- **`firebase.json`:** add an `emulators` block (`auth`, `firestore`, `ui:
  {enabled:false}`) with fixed ports.
- **`lib/firebase.ts`:** after `getAuth`/`getFirestore`, if
  `NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true"`, call `connectAuthEmulator` /
  `connectFirestoreEmulator` (guarded so it runs once). Prod path untouched.
- **`playwright.config.ts`:** `webServer` runs `next dev` with the emulator env
  var + dummy `NEXT_PUBLIC_FIREBASE_*` config; `reuseExistingServer` locally;
  single chromium project.
- **`e2e/global-setup.ts`:** seed test users via `firebase-admin` pointed at the
  Auth emulator (`FIREBASE_AUTH_EMULATOR_HOST`); set a custom claim for the
  trainer/admin user.
- **Lifecycle:** `"test:e2e": "firebase emulators:exec --only auth,firestore
  'playwright test'"` — Firebase owns emulator start/stop.

### E2E specs
1. **`route-protection.spec`** — *no emulator/Java needed* (middleware, no
   session): `/admin` → 404 body; `/dashboard` (and other protected prefixes) →
   redirect to `/login?next=…`; a public route is reachable. **Always runs.**
2. **`auth.spec`** — register a new user, log in, land on `/dashboard`. *Needs
   emulator.*
3. **`dashboard.spec`** — authenticated data flow: log a workout, read it back.
   *Needs emulator.*

### Fallback (JDK install fails)
Commit all three specs + emulator wiring **ready-to-run**, add an
`e2e/README.md` documenting the Java prerequisite, and execute **only**
`route-protection.spec` overnight. Specs 2–3 are validated for compile/shape
but marked un-run.

## 9. Orchestration & git protocol

Per the active `orchestrate` skill (own Claude 5h block near cap; Codex + AGY
have headroom):
- **Edit tasks** (test files, hook/page refactors, config) → **Codex**
  (`codex:codex-rescue`), prompts grounded with the real file content + the
  exact lint error + the required behavior-preserving transform + the
  anti-fabrication clause. Verify against gates, don't re-read blindly.
- **Reasoning/review** (e.g. reviewing a risky page refactor) → **AGY**.
- **Acceptance gates** after each delegated edit: `vitest run` (or subset) →
  `tsc --noEmit` → `eslint .` → `git diff --stat` scope check. All pass → skim +
  accept + commit. Fail → spot-fix or rework on the other agent (max 2), then
  take over.
- **One-writer:** clean tree before each dispatch; each accepted change is its
  **own commit**, then **push** to `chore/upgrade-next-16`. No PR. No co-author
  trailer.

## 10. Verification (definition of done)

- `npm test` (Vitest) green; characterization + unit + component tests pass.
- `tsc --noEmit` clean.
- `npm run lint` → **0 errors** (documented scoped exceptions only if §7b forces
  one).
- `next build` passes.
- `route-protection` E2E green; auth/data E2E green **iff** the JDK install
  succeeded, else committed ready-to-run + documented.
- All work pushed to `chore/upgrade-next-16`.
- A final summary notes what ran vs. what was deferred and why.

## 11. Out of scope
- Stripe / payments tests (feature not built).
- Middleware JWT **signature** verification (separate backlog item).
- Visual/screenshot regression.
- 3D (`Hero3D`/R3F) rendering tests.
