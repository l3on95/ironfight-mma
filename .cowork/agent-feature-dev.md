# Agent: Feature Development (@feature-dev)

> Lies zuerst CLAUDE.md im Projekt-Root — das ist der gemeinsame Basis-Kontext.

## Deine Aufgabe
Neue Features bauen: Seiten, Komponenten, Hooks, Business-Logik.
Kein Firebase-Admin, keine Stripe-Webhooks — nur Frontend + Client-Firestore.

## Relevante Typen

```typescript
// lib/training-plans.ts
type DisciplinePlan = {
  slug: "boxing"|"wrestling"|"bjj"|"muay-thai";
  name: string; tag: string; level: string;
  short: string; description: string; accent: string;
  preset: TimerConfig;
  blocks: { title: string; exercises: ExerciseBlock[] }[];
};
type ExerciseBlock = { name: string; format: string; notes?: string };

// lib/use-workout-timer.ts
type Phase = "idle"|"prep"|"work"|"rest"|"done";
type TimerConfig = { rounds: number; workSeconds: number; restSeconds: number; prepSeconds: number };
// useWorkoutTimer(initial?) → { phase, round, remaining, running, totalForPhase, config, setConfig, start, pause, reset, skip }

// lib/workouts.ts
type WorkoutSession = { id: string; label: string|null; rounds: number; workSeconds: number; restSeconds: number; completedAt: Date; totalWorkSeconds: number };
type WorkoutStats = { total: number; thisWeek: number; streak: number; lastLabel: string|null };
// logWorkout(uid, config, label) | getRecentWorkouts(uid, count?) | computeStats(sessions[])

// lib/auth-context.tsx
// useAuth() → { user: User|null, loading: boolean, signIn, signUp, logOut }
```

## Routing-Muster
- Neue Seite: `app/[route]/page.tsx`
- Protected: `<ProtectedRoute>` wrappen
- Query-Params: `useSearchParams()` immer in `<Suspense>` wrappen
- SSG: `generateStaticParams()` + `generateMetadata()` verwenden

## Nächste Features (Priorität)
1. **`/history`** — Alle Workouts mit Datumsfilter + Kalender-Heatmap (GitHub-style)
2. **`/training/[slug]`** erweitern — Live-Übungs-Tracker (Checkbox, Progress-Bar)
3. **`/profile`** — displayName, Gewicht, Hauptdisziplin → Firestore `users/{uid}/profile`

## Arbeitsweise
- Zuerst relevante Dateien lesen, dann schreiben
- Neue Hooks → `lib/`, neue Komponenten → `components/`
- Jede Seite bekommt `<PageHeader eyebrow="..." title="..." />`
- Nach Änderungen: `npm run build` prüfen
