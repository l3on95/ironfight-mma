# IronFight MMA — Project Context

> The source of truth is the code. This file records only **stable** conventions
> and architecture decisions — NOT a full file listing (which drifts immediately).
> For the current structure, look at `app/`, `lib/`, `components/`.

## Identity
- **App:** IronFight MMA / Tidal Athletics — MMA training & coaching app
- **Firebase project:** ironfight-mma (ironfight-mma.firebaseapp.com)
- **Repo:** github.com/Kern-Digital/ironfight-mma

## Tech Stack
| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js App Router | 16.2.9 |
| Language | TypeScript (strict) | 6.x |
| Styling | Tailwind CSS | 4.x |
| Auth + DB | Firebase Web SDK (Auth + Firestore) | 12.x |
| Admin | firebase-admin (scripts / server-side only) | 14.x |
| 3D | @react-three/fiber v9 + drei v10 | (requires React 19) |
| Animation | Framer Motion | 12.x |
| State | Zustand (installed) | 5.x |
| Payments | Stripe (installed, not yet built) | — |
| React | React | 19 |
| Lint | ESLint (flat config) | 9.x — see note below |

> **ESLint pinned to 9.x.** `eslint-config-next` 16 bundles
> `eslint-plugin-react` 7.37.x, whose newest release still caps at `eslint ^9.7`
> and crashes on ESLint 10 (which removed `context.getFilename()`). 9.39.4 is the
> newest ESLint the Next 16 lint stack supports. Revisit once the React plugin
> ships ESLint 10 support.

## Architecture & Patterns (important)
- **Firebase is ALWAYS lazy** via `lib/firebase.ts`: `getFirebaseApp()` /
  `getFirebaseAuth()` / `getFirestoreDb()` — never a module-level `initializeApp()`.
- **`"use client"`** on every component that uses `useAuth` / `useState` / `useEffect`.
- **`@/` alias** for all imports.
- **Auth context:** `lib/auth-context.tsx` → `AuthProvider` + `useAuth()`.
  It mirrors the ID token into a `__session` cookie (consumed by the middleware).

### Roles & Permissions (security-critical)
- Roles (`user` | `trainer` | `admin`) are **authoritative in Firebase Auth
  custom claims**. A `role` field is also mirrored into the `users/{uid}`
  document, but **only** by the admin script (`set-role.mjs`) — never by a client,
  and it is not the source rules trust.
- The client reads the role via `getIdTokenResult()` (`claims.role`) — see
  `auth-context.tsx` (`refreshRole()` forces a token refresh after a claim change).
- Roles are set **server-side only** via the Admin SDK:
  `node scripts/set-role.mjs <uid> <role>` or `--backfill`
  (requires `GOOGLE_APPLICATION_CREDENTIALS`). The script sets the custom claim
  AND writes the mirror `role` field on the user doc. **No in-app path** writes
  `role`.
- `firestore.rules` reads `request.auth.token.role`; clients may never write the
  `role` field (privilege escalation closed).

### Route protection (two layers)
- **Server:** `middleware.ts` (Edge) gates via the `__session` cookie:
  `/admin/*` → 404 (hide existence), other protected areas → redirect to
  `/login`. Kill switch via `MIDDLEWARE_AUTH=off`. (No signature verification yet —
  real data security lives in the Firestore rules.)
- **Client:** `<ProtectedRoute>` as an additional UI guard.

## Design System
- Dark by default, **plus a light theme** via `lib/theme-context.tsx`.
- Tokens as CSS variables in `app/globals.css`:
  `--ink-0..6` (background layers) · `--fg`, `--fg-2..4` (text) · pink accent.
- Tailwind colors in `tailwind.config.ts`: `pink` (accent), `ink`, `blood`, `carbon`.
- Utility classes include: `card-glass`, `font-mono-ta` (mono via `var(--font-mono)`).
- **Tailwind 4 setup:** `app/globals.css` starts with `@import "tailwindcss";` and
  loads the legacy config via `@config "../tailwind.config.ts";`. The PostCSS
  plugin is `@tailwindcss/postcss` (configured in `postcss.config.mjs`);
  autoprefixer is built in.

## Firestore (top-level collections)
```
users/{uid}              — profile (role only via custom claims + admin-written mirror)
users/{uid}/workouts     — logged workouts
opponents/{id}           — opponent "DNA" library (trainer/admin)
trainingSessions/**      — gym-wide curriculum (all read, trainer/admin write)
techniqueStats/{id}      — anonymous view counters (only viewCount / lastViewed)
```
Rules + indexes: `firestore.rules`, `firestore.indexes.json`, `firebase.json`.

## Conventions
- German in UI text, English in code.
- Components: default export · Utilities: named exports.
- Env vars: no quotes in `.env.local` (template: `.env.local.example`).
- Lint uses flat config (`eslint.config.mjs`); the `lint` script is `eslint .`
  (`next lint` was removed in Next 16).

## Backlog (open)
- [ ] Stripe Pro membership (checkout, webhook, premium gate)
- [ ] Middleware: server-side token signature verification (service account)
- [x] Lint cleanup: Next 16's stricter `react-hooks` rules + `no-unescaped-entities`
  (was ~46 findings). `npm run lint` is now green. The 4 behavior-sensitive hooks
  (`use-workout-timer`, `use-trainer-hints`, `use-timer-settings`, `theme-context`)
  were refactored to `useSyncExternalStore` / derived state under characterization
  tests; mechanical findings (purity, static-components, unescaped-entities) were
  fixed in place.
- [x] Eliminate the 25 scoped `react-hooks/set-state-in-effect` suppressions in
  `app/**` + `components/PwaInstallPrompt.tsx`. Done via the chosen full
  React-Query migration: every Firestore-fetch effect → `useQuery` (TanStack
  React Query v5, provider in `components/QueryProvider.tsx`); mount-time
  browser-capability reads → `useSyncExternalStore`; prop/URL→state syncs →
  derived / lazy-init state. The faithful derivation preserves the prior
  semantics exactly — `null` while pending (drives existing skeleton checks),
  error → stable empty fallback (empty-state, not perpetual skeleton); mutations
  use `invalidateQueries` / optimistic `setQueryData`; the dashboard athlete
  query keeps its 15s timeout race with `retry: false`. `grep -rn
  "set-state-in-effect"` is now empty repo-wide and `npm run lint` is green.
  Page tests guarding the conversions were added for the dashboard (athlete +
  trainer) and admin-users pages (`app/**/__tests__/`, mock `useAuth` +
  `next/navigation`, wrap in `QueryClientProvider`); the other converted pages
  share the same query-derivation contract those tests exercise. (Separate,
  out-of-scope: 3 pre-existing `react-hooks/exhaustive-deps` suppressions remain
  in `app/workout/*`.)
- [ ] Re-evaluate ESLint 10 once `eslint-plugin-react` supports it.
