"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Skeleton from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import OpponentProfileView from "@/components/trainer/OpponentProfileView";
import OpponentEditor, {
  type OpponentEditorValue,
} from "@/components/trainer/OpponentEditor";
import { useAuth } from "@/lib/auth-context";
import {
  deleteOpponent,
  getOpponent,
  updateOpponent,
} from "@/lib/opponents";
import { totalAnswered } from "@/lib/gegner-dna";

function formatDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return d.toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type DetailTab = "uebersicht" | "dna" | "stats" | "videos";

const DETAIL_TABS: [DetailTab, string][] = [
  ["uebersicht", "Übersicht"],
  ["dna", "DNA"],
  ["stats", "Stats"],
  ["videos", "Videos"],
];

/** Platzhalter, bis Video-Upload + KI-Analyse (Konzept §6) gebaut sind. */
function VideosPlaceholder() {
  return (
    <div
      className="rounded-2xl p-8 text-center"
      style={{ border: "1px dashed var(--ink-5)", background: "var(--ink-2)" }}
    >
      <p className="text-sm font-bold" style={{ color: "var(--fg-3)" }}>
        Video-Analyse — in Vorbereitung.
      </p>
      <p className="mx-auto mt-1 max-w-md text-xs" style={{ color: "var(--fg-4)" }}>
        Hier lädst du künftig Kampf-Videos hoch. Die KI analysiert jedes Video
        einzeln und aktualisiert die Gegner-DNA — Befunde mit Widerspruch
        landen zur Bestätigung bei dir, nichts wird still überschrieben.
      </p>
    </div>
  );
}

function OpponentDetailContent({ id }: { id: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const opponentKey = ["opponent", id] as const;
  const [mutationError, setMutationError] = useState<string | null>(null);
  const {
    data,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: opponentKey,
    queryFn: async () => {
      const o = await getOpponent(id);
      if (!o) throw new Error("Gegner-DNA-Profil nicht gefunden");
      return o;
    },
  });
  const opponent = queryError ? null : (data ?? null);
  const error =
    mutationError ??
    (queryError
      ? queryError instanceof Error
        ? queryError.message
        : "Unbekannter Fehler"
      : null);
  const retry = () => {
    setMutationError(null);
    refetch();
  };
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<DetailTab>("uebersicht");

  async function handleSave(value: OpponentEditorValue) {
    if (!opponent) return;
    setBusy(true);
    setMutationError(null);
    try {
      await updateOpponent(opponent.id, {
        ...value,
        updatedBy: user?.uid ?? null,
      });
      await queryClient.invalidateQueries({ queryKey: opponentKey });
      setEditing(false);
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "Speichern fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!opponent) return;
    if (
      !confirm(
        `Gegner-DNA „${opponent.name}" wirklich löschen? Bereits angelegte Wettkämpfe behalten ihren gespeicherten Snapshot.`,
      )
    )
      return;
    try {
      await deleteOpponent(opponent.id);
      router.push("/trainer/competitions?tab=dna");
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "Löschen fehlgeschlagen");
    }
  }

  if (error && !opponent) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <ErrorState
          title="Profil konnte nicht geladen werden"
          message={error}
          onRetry={retry}
        />
      </div>
    );
  }

  if (!opponent) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const answers = totalAnswered(opponent.dna);

  return (
    <main className="min-h-screen" style={{ background: "var(--ink-1)" }}>
      {/* Header */}
      <div
        className="border-b px-4 py-7 sm:px-6"
        style={{
          borderColor: "rgba(255,79,168,0.2)",
          background:
            "radial-gradient(500px 220px at 100% 50%, rgba(255,79,168,0.1), transparent 60%), linear-gradient(160deg, #140A12, #080512)",
        }}
      >
        <div className="mx-auto max-w-3xl">
          <Link
            href="/trainer/competitions?tab=dna"
            className="font-mono-ta text-[10px] uppercase"
            style={{ letterSpacing: "0.2em", color: "var(--fg-4)" }}
          >
            ← Gegner-DNA-Bibliothek
          </Link>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1
                className="font-display-ta font-black uppercase leading-none"
                style={{ fontSize: "clamp(22px, 4vw, 32px)", letterSpacing: "0.02em" }}
              >
                {opponent.name}
              </h1>
              <p
                className="font-mono-ta mt-2 text-[10px] uppercase"
                style={{ letterSpacing: "0.18em", color: "var(--fg-4)" }}
              >
                Gegner-DNA · {answers} {answers === 1 ? "Eintrag" : "Einträge"} ·
                Aktualisiert {formatDate(opponent.updatedAt)}
              </p>
            </div>
            {!editing && (
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/trainer/competitions/new?opponent=${opponent.id}`}
                  className="btn-secondary px-4 py-2 text-xs"
                >
                  Wettkampf anlegen
                </Link>
                <button
                  onClick={() => setEditing(true)}
                  className="btn-primary px-4 py-2 text-xs"
                >
                  Bearbeiten
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-7 sm:px-6">
        {error && (
          <div className="mb-4">
            <ErrorState title="Fehler" message={error} onRetry={retry} />
          </div>
        )}

        {editing ? (
          <>
            <OpponentEditor
              initial={{
                name: opponent.name,
                style: opponent.style,
                stance: opponent.stance,
                heightCm: opponent.heightCm,
                weightKg: opponent.weightKg,
                reachCm: opponent.reachCm,
                strengths: opponent.strengths,
                weaknesses: opponent.weaknesses,
                favoriteAttacks: opponent.favoriteAttacks,
                notes: opponent.notes,
                dna: opponent.dna,
                dnaSplit: opponent.dnaSplit,
                actionStats: opponent.actionStats,
              }}
              busy={busy}
              submitLabel="Speichern"
              onSubmit={handleSave}
              onCancel={() => setEditing(false)}
            />
            <div className="mt-6 border-t pt-4" style={{ borderColor: "var(--ink-4)" }}>
              <button
                onClick={handleDelete}
                className="font-mono-ta rounded-lg px-3 py-1.5 text-[10px] uppercase"
                style={{
                  letterSpacing: "0.15em",
                  background: "transparent",
                  border: "1px solid var(--ink-5)",
                  color: "var(--fg-4)",
                }}
              >
                Gegner-DNA löschen
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Tabs: schneller Blick (Übersicht) vs. tiefes Scouting (DNA/Stats) */}
            <div
              className="mb-5 inline-flex gap-1 rounded-xl p-1"
              style={{ background: "var(--ink-3)", border: "1px solid var(--ink-5)" }}
            >
              {DETAIL_TABS.map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className="font-mono-ta rounded-lg px-4 py-2 text-[11px] font-bold uppercase transition-colors"
                  style={{
                    letterSpacing: "0.12em",
                    background: tab === id ? "var(--ta-pink)" : "transparent",
                    color: tab === id ? "#fff" : "var(--fg-3)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === "videos" ? (
              <VideosPlaceholder />
            ) : (
              <OpponentProfileView
                section={
                  tab === "uebersicht" ? "overview" : tab === "dna" ? "dna" : "stats"
                }
                opponent={{
                  name: opponent.name,
                  style: opponent.style,
                  stance: opponent.stance,
                  heightCm: opponent.heightCm,
                  weightKg: opponent.weightKg,
                  reachCm: opponent.reachCm,
                  strengths: opponent.strengths,
                  weaknesses: opponent.weaknesses,
                  favoriteAttacks: opponent.favoriteAttacks,
                  notes: opponent.notes,
                  dna: opponent.dna,
                  dnaSplit: opponent.dnaSplit,
                  actionStats: opponent.actionStats,
                }}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function OpponentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <OpponentDetailContent id={params.id} />;
}
