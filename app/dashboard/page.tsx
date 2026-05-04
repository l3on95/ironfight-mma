"use client";

import PageHeader from "@/components/PageHeader";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";
import {
  computeStats,
  getRecentWorkouts,
  type WorkoutSession,
  type WorkoutStats,
} from "@/lib/workouts";
import Link from "next/link";
import { useEffect, useState } from "react";

function formatRelative(d: Date) {
  const diffMs = Date.now() - d.getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "gerade eben";
  if (minutes < 60) return `vor ${minutes} Min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `vor ${hours} Std`;
  const days = Math.round(hours / 24);
  if (days < 7) return `vor ${days} ${days === 1 ? "Tag" : "Tagen"}`;
  return d.toLocaleDateString("de-DE");
}

function formatMinutes(seconds: number) {
  const m = Math.round(seconds / 60);
  return `${m} min`;
}

function DashboardContent() {
  const { user } = useAuth();
  const greeting = user?.displayName || user?.email?.split("@")[0] || "Fighter";

  const [sessions, setSessions] = useState<WorkoutSession[] | null>(null);
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setError(null);
    setSessions(null);
    setStats(null);

    getRecentWorkouts(user.uid, 10)
      .then((data) => {
        if (cancelled) return;
        setSessions(data);
        setStats(computeStats(data));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
        setError(msg);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const statCards = [
    { label: "Diese Woche", value: stats ? String(stats.thisWeek) : "—" },
    {
      label: "Streak",
      value: stats
        ? `${stats.streak} ${stats.streak === 1 ? "Tag" : "Tage"}`
        : "—",
    },
    { label: "Gesamt-Workouts", value: stats ? String(stats.total) : "—" },
    { label: "Letzter Plan", value: stats?.lastLabel ?? "—" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Dein Cage"
        title={`Willkommen, ${greeting}`}
        description="Deine Trainings, Streaks und Fortschritte auf einen Blick."
      />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        {error && (
          <div className="mb-6 rounded-sm border border-blood/40 bg-blood/10 px-4 py-3 text-sm text-blood">
            <strong>Daten konnten nicht geladen werden.</strong> {error}
            <div className="mt-1 text-xs text-foreground/70">
              Prüfe ob Firestore in der Firebase Console aktiviert ist.
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <div key={stat.label} className="card">
              <div className="text-xs font-bold uppercase tracking-widest text-foreground/60">
                {stat.label}
              </div>
              <div className="font-display mt-3 text-4xl font-black text-blood">
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 card">
          <div className="flex items-center justify-between">
            <h2 className="heading-display text-2xl font-black">
              Letzte Trainings
            </h2>
            <Link
              href="/training"
              className="text-xs font-bold uppercase tracking-widest text-foreground/70 hover:text-blood"
            >
              + Neue Session
            </Link>
          </div>

          {sessions === null && !error && (
            <div className="mt-6 text-sm text-foreground/60">Lade Sessions…</div>
          )}

          {sessions && sessions.length === 0 && (
            <div className="mt-6 text-sm text-foreground/60">
              Noch keine Sessions. Starte ein Workout über{" "}
              <Link href="/training" className="text-blood hover:underline">
                Trainingspläne
              </Link>{" "}
              oder den{" "}
              <Link href="/timer" className="text-blood hover:underline">
                Timer
              </Link>
              .
            </div>
          )}

          {sessions && sessions.length > 0 && (
            <ul className="mt-6 divide-y divide-carbon-500/60">
              {sessions.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <div className="font-bold">{s.label ?? "Freies Workout"}</div>
                    <div className="text-xs uppercase tracking-widest text-foreground/60">
                      {s.rounds}× {Math.round(s.workSeconds / 60)} min · Pause{" "}
                      {s.restSeconds}s
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-blood">
                      {formatMinutes(s.totalWorkSeconds)}
                    </div>
                    <div className="text-xs uppercase tracking-widest text-foreground/60">
                      {formatRelative(s.completedAt)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
