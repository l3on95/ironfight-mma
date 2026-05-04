"use client";

import PageHeader from "@/components/PageHeader";
import {
  DEFAULT_CONFIG,
  useWorkoutTimer,
  type Phase,
  type TimerConfig,
} from "@/lib/use-workout-timer";
import { useAuth } from "@/lib/auth-context";
import { logWorkout } from "@/lib/workouts";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

const PRESETS: { label: string; config: TimerConfig }[] = [
  {
    label: "Boxing 3×3",
    config: { rounds: 3, workSeconds: 180, restSeconds: 60, prepSeconds: 10 },
  },
  {
    label: "MMA 5×5",
    config: { rounds: 5, workSeconds: 300, restSeconds: 60, prepSeconds: 10 },
  },
  {
    label: "HIIT Tabata",
    config: { rounds: 8, workSeconds: 20, restSeconds: 10, prepSeconds: 10 },
  },
  {
    label: "Heavy Bag",
    config: { rounds: 6, workSeconds: 120, restSeconds: 30, prepSeconds: 10 },
  },
];

const PHASE_LABEL: Record<Phase, string> = {
  idle: "Bereit",
  prep: "Vorbereitung",
  work: "Kampf",
  rest: "Pause",
  done: "Fertig!",
};

const PHASE_COLOR: Record<Phase, string> = {
  idle: "text-foreground",
  prep: "text-yellow-400",
  work: "text-blood",
  rest: "text-blue-400",
  done: "text-green-400",
};

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

function parsePositive(v: string | null, fallback: number) {
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function TimerView() {
  const params = useSearchParams();
  const { user } = useAuth();

  const initial = useMemo<TimerConfig>(
    () => ({
      rounds: parsePositive(params.get("rounds"), DEFAULT_CONFIG.rounds),
      workSeconds: parsePositive(params.get("work"), DEFAULT_CONFIG.workSeconds),
      restSeconds: parsePositive(params.get("rest"), DEFAULT_CONFIG.restSeconds),
      prepSeconds: parsePositive(params.get("prep"), DEFAULT_CONFIG.prepSeconds),
    }),
    [params],
  );
  const label = params.get("label");

  const t = useWorkoutTimer(initial);
  const progress =
    t.phase === "idle" || t.totalForPhase === 0
      ? 0
      : 1 - t.remaining / t.totalForPhase;

  const [logState, setLogState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const loggedRef = useRef<symbol | null>(null);

  useEffect(() => {
    if (t.phase !== "done") {
      if (t.phase === "idle" || t.phase === "prep") {
        loggedRef.current = null;
        setLogState("idle");
      }
      return;
    }
    if (!user) {
      setLogState("idle");
      return;
    }
    const sessionToken = Symbol("session");
    if (loggedRef.current) return;
    loggedRef.current = sessionToken;
    setLogState("saving");
    logWorkout(user.uid, t.config, label)
      .then(() => setLogState("saved"))
      .catch(() => {
        setLogState("error");
        loggedRef.current = null;
      });
  }, [t.phase, user, t.config, label]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const original = document.title;
    if (t.running || t.phase === "done") {
      document.title = `${formatTime(t.remaining)} · ${PHASE_LABEL[t.phase]} — IronFight`;
    }
    return () => {
      document.title = original;
    };
  }, [t.remaining, t.phase, t.running]);

  function updateConfig<K extends keyof TimerConfig>(key: K, value: number) {
    t.setConfig({ ...t.config, [key]: Math.max(1, Math.floor(value || 0)) });
  }

  const isLocked = t.phase !== "idle";

  return (
    <>
      <PageHeader
        eyebrow={label ? `Workout · ${label}` : "Workout"}
        title="Runden-Timer"
        description="Konfiguriere Runden, Pausen und Vorbereitung — dann auf die Glocke."
      />

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div className={`text-xs font-bold uppercase tracking-widest ${PHASE_COLOR[t.phase]}`}>
              {PHASE_LABEL[t.phase]}
            </div>
            <div className="text-xs uppercase tracking-widest text-foreground/60">
              Runde {Math.min(t.round, t.config.rounds)} / {t.config.rounds}
            </div>
          </div>

          <div className="my-8 text-center">
            <div
              className={`font-display text-8xl font-black leading-none sm:text-9xl ${PHASE_COLOR[t.phase]}`}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {formatTime(t.remaining)}
            </div>
          </div>

          <div className="h-2 overflow-hidden rounded-sm bg-carbon-600">
            <div
              className={`h-full transition-all duration-200 ${
                t.phase === "work"
                  ? "bg-blood"
                  : t.phase === "rest"
                    ? "bg-blue-500"
                    : t.phase === "prep"
                      ? "bg-yellow-500"
                      : t.phase === "done"
                        ? "bg-green-500"
                        : "bg-carbon-400"
              }`}
              style={{ width: `${Math.min(100, progress * 100)}%` }}
            />
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {!t.running ? (
              <button onClick={t.start} className="btn-primary px-8">
                {t.phase === "idle" || t.phase === "done" ? "Start" : "Weiter"}
              </button>
            ) : (
              <button onClick={t.pause} className="btn-primary px-8">
                Pause
              </button>
            )}
            <button onClick={t.skip} className="btn-secondary" disabled={t.phase === "idle" || t.phase === "done"}>
              Skip
            </button>
            <button onClick={t.reset} className="btn-secondary">
              Reset
            </button>
          </div>

          {t.phase === "done" && (
            <div className="mt-6 text-center text-xs uppercase tracking-widest">
              {!user && (
                <span className="text-foreground/50">
                  Login, um Sessions zu speichern
                </span>
              )}
              {user && logState === "saving" && (
                <span className="text-foreground/60">Speichere Session…</span>
              )}
              {user && logState === "saved" && (
                <span className="text-green-400">Session gespeichert ✓</span>
              )}
              {user && logState === "error" && (
                <span className="text-blood">
                  Speichern fehlgeschlagen — Firestore aktiviert?
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mt-8">
          <div className="mb-3 text-xs font-bold uppercase tracking-widest text-foreground/60">
            Presets
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  t.setConfig(p.config);
                  t.reset();
                }}
                disabled={isLocked}
                className="rounded-sm border border-carbon-400 bg-carbon-700/60 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors hover:border-blood hover:text-blood disabled:cursor-not-allowed disabled:opacity-40"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 card">
          <div className="mb-4 text-xs font-bold uppercase tracking-widest text-blood">
            Konfiguration
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ConfigField
              label="Runden"
              value={t.config.rounds}
              onChange={(v) => updateConfig("rounds", v)}
              disabled={isLocked}
              suffix="×"
            />
            <ConfigField
              label="Kampf (Sek.)"
              value={t.config.workSeconds}
              onChange={(v) => updateConfig("workSeconds", v)}
              disabled={isLocked}
              suffix="s"
            />
            <ConfigField
              label="Pause (Sek.)"
              value={t.config.restSeconds}
              onChange={(v) => updateConfig("restSeconds", v)}
              disabled={isLocked}
              suffix="s"
            />
            <ConfigField
              label="Vorlauf (Sek.)"
              value={t.config.prepSeconds}
              onChange={(v) => updateConfig("prepSeconds", v)}
              disabled={isLocked}
              suffix="s"
            />
          </div>
          {isLocked && (
            <p className="mt-4 text-xs text-foreground/60">
              Reset drücken, um die Konfiguration zu ändern.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function ConfigField({
  label,
  value,
  onChange,
  disabled,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  suffix?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-foreground/70">
        {label}
      </label>
      <div className="flex">
        <input
          type="number"
          min={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="w-full rounded-sm border border-carbon-400 bg-carbon-800 px-3 py-2 text-sm focus:border-blood focus:outline-none disabled:opacity-50"
        />
        {suffix && (
          <span className="ml-2 self-center text-xs text-foreground/60">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export default function TimerPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-32 text-center text-sm uppercase tracking-widest text-foreground/60 sm:px-6">
          Lade Timer…
        </div>
      }
    >
      <TimerView />
    </Suspense>
  );
}
