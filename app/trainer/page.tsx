"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import TrainerHint from "@/components/TrainerHint";
import Skeleton from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import CompetitionCard, {
  competitionGroup,
} from "@/components/trainer/CompetitionCard";
import { useAuth } from "@/lib/auth-context";
import { belongsToGym, resolveGymId } from "@/lib/gym";
import {
  FIGHT_STYLE_LABEL,
  listAllFightCamps,
  type FightCamp,
} from "@/lib/fight-camp";
import { listOpponentsForGym, type Opponent } from "@/lib/opponents";
import { listAllStudents, type StudentEntry } from "@/lib/admin";
import { totalAnswered } from "@/lib/gegner-dna";

function studentLabelOf(entry: StudentEntry | undefined): string {
  if (!entry) return "Schüler";
  return entry.displayName ?? entry.authProviderName ?? entry.email ?? "Schüler";
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Bausteine ───────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  accent,
  href,
}: {
  label: string;
  value: number;
  accent: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl p-4 transition-colors"
      style={{
        background: "linear-gradient(180deg, var(--ink-3), var(--ink-2))",
        border: "1px solid var(--ink-4)",
        textDecoration: "none",
      }}
    >
      <div
        className="font-display-ta font-black leading-none"
        style={{ fontSize: "28px", color: accent }}
      >
        {value}
      </div>
      <div
        className="font-mono-ta mt-1.5 text-[10px] uppercase"
        style={{ letterSpacing: "0.15em", color: "var(--fg-4)" }}
      >
        {label}
      </div>
    </Link>
  );
}

function SectionHead({
  title,
  accent,
  moreHref,
  moreLabel,
}: {
  title: string;
  accent: string;
  moreHref?: string;
  moreLabel?: string;
}) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between gap-3">
      <h2
        className="font-mono-ta text-[11px] font-bold uppercase"
        style={{ letterSpacing: "0.2em", color: accent }}
      >
        {title}
      </h2>
      {moreHref && (
        <Link
          href={moreHref}
          className="font-mono-ta shrink-0 text-[10px] uppercase"
          style={{ letterSpacing: "0.12em", color: "var(--fg-4)" }}
        >
          {moreLabel ?? "Alle"} →
        </Link>
      )}
    </div>
  );
}

function OpponentMiniCard({ opponent }: { opponent: Opponent }) {
  const dnaCount = totalAnswered(opponent.dna);
  return (
    <Link
      href={`/trainer/opponents/${opponent.id}`}
      className="block rounded-2xl p-4 transition-colors"
      style={{
        background: "linear-gradient(180deg, var(--ink-3), var(--ink-2))",
        border: "1px solid var(--ink-4)",
        textDecoration: "none",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="font-display-ta truncate font-black uppercase"
          style={{ fontSize: "14px", letterSpacing: "0.03em", color: "var(--fg)" }}
        >
          {opponent.name}
        </div>
        <span
          className="font-mono-ta shrink-0 rounded px-1.5 py-0.5 text-[9px] uppercase"
          style={{
            letterSpacing: "0.12em",
            background: dnaCount > 0 ? "rgba(0,212,230,0.1)" : "var(--ink-4)",
            border: `1px solid ${dnaCount > 0 ? "rgba(0,212,230,0.35)" : "var(--ink-5)"}`,
            color: dnaCount > 0 ? "var(--ta-cyan)" : "var(--fg-4)",
          }}
        >
          DNA {dnaCount}
        </span>
      </div>
      <div
        className="font-mono-ta mt-1 truncate text-[10px] uppercase"
        style={{ letterSpacing: "0.12em", color: "var(--fg-4)" }}
      >
        {FIGHT_STYLE_LABEL[opponent.style]} · {formatDate(opponent.updatedAt)}
      </div>
    </Link>
  );
}

function EmptyCard({ title, hint }: { title: string; hint?: string }) {
  return (
    <div
      className="rounded-2xl p-8 text-center"
      style={{ border: "1px dashed var(--ink-5)", background: "var(--ink-2)" }}
    >
      <p className="text-sm font-bold" style={{ color: "var(--fg-3)" }}>
        {title}
      </p>
      {hint && (
        <p className="mt-1 text-xs" style={{ color: "var(--fg-4)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

// ─── Seite ───────────────────────────────────────────────────────────────────

export default function TrainerDashboardPage() {
  const { profile } = useAuth();
  const gymId = resolveGymId(profile);

  const [camps, setCamps] = useState<FightCamp[] | null>(null);
  const [opponents, setOpponents] = useState<Opponent[] | null>(null);
  const [students, setStudents] = useState<StudentEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setCamps(null);
    setOpponents(null);
    setStudents(null);
    try {
      const [allCamps, gymOpponents, studentList] = await Promise.all([
        listAllFightCamps().catch(() => [] as FightCamp[]),
        listOpponentsForGym(gymId).catch(() => [] as Opponent[]),
        listAllStudents().catch(() => [] as StudentEntry[]),
      ]);
      setCamps(allCamps.filter((c) => belongsToGym(c.gymId, gymId)));
      setOpponents(gymOpponents);
      setStudents(studentList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      setCamps([]);
      setOpponents([]);
      setStudents([]);
    }
  }, [gymId]);

  useEffect(() => {
    load();
  }, [load]);

  const studentMap = useMemo(
    () => new Map((students ?? []).map((s) => [s.uid, s])),
    [students],
  );

  const upcoming = useMemo(
    () =>
      (camps ?? [])
        .filter((c) => competitionGroup(c) === "upcoming")
        .sort((a, b) => a.competitionDate.getTime() - b.competitionDate.getTime()),
    [camps],
  );

  // listOpponentsForGym liefert bereits nach updatedAt absteigend sortiert.
  const recentOpponents = useMemo(() => (opponents ?? []).slice(0, 6), [opponents]);

  const loading = camps === null || opponents === null || students === null;

  return (
    <main className="min-h-screen" style={{ background: "var(--ink-1)" }}>
      {/* Header */}
      <div
        className="relative overflow-hidden border-b px-4 py-9 sm:px-6"
        style={{
          borderColor: "rgba(255,45,120,0.2)",
          background:
            "radial-gradient(420px 250px at 100% 50%, rgba(255,45,120,0.12), transparent 60%), linear-gradient(160deg, #0A0709, #050505)",
        }}
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-2 flex items-center gap-2">
            <span
              className="font-mono-ta rounded px-2 py-0.5 text-[10px] font-black uppercase"
              style={{
                letterSpacing: "0.2em",
                background: "rgba(255,45,120,0.12)",
                border: "1px solid rgba(255,45,120,0.4)",
                color: "var(--ta-pink)",
              }}
            >
              Trainer
            </span>
          </div>
          <h1
            className="font-display-ta font-black uppercase leading-none"
            style={{ fontSize: "clamp(28px, 5vw, 42px)", letterSpacing: "0.02em" }}
          >
            Dashboard
          </h1>
          <p
            className="font-mono-ta mt-2 text-[11px] uppercase"
            style={{ letterSpacing: "0.2em", color: "var(--fg-4)" }}
          >
            Schüler · Stundenplan · Wettkampf
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
        <TrainerHint id="trainer-dashboard" title="Trainer-Dashboard">
          Dein Einstieg in den Trainerbereich: anstehende Wettkämpfe, zuletzt
          bearbeitete Gegner-DNA und Schnellzugriffe. Alles Weitere findest du
          über die Bereichs-Navigation oben.
        </TrainerHint>

        {error && (
          <div className="mb-5">
            <ErrorState
              title="Daten konnten nicht geladen werden"
              message={error}
              onRetry={load}
            />
          </div>
        )}

        {/* Schnellaktionen */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Link href="/trainer/competitions/new" className="btn-primary px-4 py-2 text-xs">
            + Neuer Wettkampf
          </Link>
          <Link
            href="/trainer/competitions?tab=dna"
            className="btn-secondary px-4 py-2 text-xs"
          >
            + Neue Gegner-DNA
          </Link>
          <Link href="/trainer/students" className="btn-secondary px-4 py-2 text-xs">
            Schüler ansehen
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            {/* Kennzahlen */}
            <div className="grid gap-3 sm:grid-cols-3">
              <KpiCard
                label="Anstehende Wettkämpfe"
                value={upcoming.length}
                accent="var(--ta-cyan)"
                href="/trainer/competitions"
              />
              <KpiCard
                label="Gegner-DNA-Profile"
                value={(opponents ?? []).length}
                accent="var(--ta-pink)"
                href="/trainer/competitions?tab=dna"
              />
              <KpiCard
                label="Schüler"
                value={(students ?? []).length}
                accent="#FBBF24"
                href="/trainer/students"
              />
            </div>

            {/* Nächste Wettkämpfe */}
            <section className="mt-7">
              <SectionHead
                title="Nächste Wettkämpfe"
                accent="var(--ta-cyan)"
                moreHref="/trainer/competitions"
                moreLabel="Alle Wettkämpfe"
              />
              {upcoming.length === 0 ? (
                <EmptyCard
                  title="Kein Wettkampf geplant."
                  hint="Lege einen Wettkampf an — wähle einen Schüler und einen Gegner."
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {upcoming.slice(0, 3).map((c) => (
                    <CompetitionCard
                      key={c.id}
                      camp={c}
                      studentLabel={studentLabelOf(studentMap.get(c.studentUid))}
                      href={`/trainer/competitions/${c.studentUid}/${c.id}`}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Zuletzt bearbeitete Gegner-DNA */}
            <section className="mt-7">
              <SectionHead
                title="Zuletzt bearbeitete Gegner-DNA"
                accent="var(--ta-pink)"
                moreHref="/trainer/competitions?tab=dna"
                moreLabel="Bibliothek"
              />
              {recentOpponents.length === 0 ? (
                <EmptyCard
                  title="Noch keine Gegner-DNA angelegt."
                  hint="Gegnerprofile werden gym-weit für alle Trainer geteilt."
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {recentOpponents.map((o) => (
                    <OpponentMiniCard key={o.id} opponent={o} />
                  ))}
                </div>
              )}
            </section>

            {/* KI-Review-Queue (Platzhalter bis zur Video-Analyse) */}
            <section className="mt-7">
              <SectionHead title="KI-Review" accent="#A78BFA" />
              <EmptyCard
                title="Keine offenen KI-Befunde."
                hint="Sobald die Video-Analyse aktiv ist, erscheinen hier Befunde, die auf deine Bestätigung warten — Widersprüche überschreiben nie automatisch."
              />
            </section>
          </>
        )}
      </div>
    </main>
  );
}
