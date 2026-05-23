/**
 * Fight-Camp — Wettkampfvorbereitung aus Trainersicht
 *
 * Datenmodell + Firestore-CRUD für strukturierte Wettkampfvorbereitung.
 * Speichert pro Schüler ein Fight-Camp mit:
 *   • Gegner-Profil (Name, Stil, Stärken/Schwächen, Daten)
 *   • Kampfdatum + Anzahl Wochen
 *   • 4-Phasen-Plan (Aufbau → Schwerpunkt → Sparring → Taper)
 *   • Trainings-Empfehlungen (Techniken & Übungen)
 *
 * Firestore-Schema:
 *   users/{uid}/fightCamps/{campId}
 *     → enthält Camp-Stamm + Gegner-Profil + Plan (als Embedded-Felder)
 *
 * Wichtig: Trainer schreibt in fremde User-Subcollections — Firestore-Rules
 * müssen das erlauben, ähnlich wie listAllStudents.
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { getFirestoreDb } from "./firebase";
import type { Category, TrainingArea } from "./types";

// ─── Gegner-Stil ───────────────────────────────────────────────────────────

export type FighterStance = "orthodox" | "southpaw" | "switch";

export const FIGHTER_STANCE_LABEL: Record<FighterStance, string> = {
  orthodox: "Orthodox (Rechtsausleger)",
  southpaw: "Southpaw (Linksausleger)",
  switch: "Switch (beidseitig)",
};

export type FightStyle =
  | "striker"
  | "grappler"
  | "wrestler"
  | "all-rounder"
  | "bjj-specialist"
  | "kickboxer"
  | "pressure-fighter"
  | "counter-striker";

export const FIGHT_STYLE_LABEL: Record<FightStyle, string> = {
  striker: "Striker (Stand-Up-Spezialist)",
  grappler: "Grappler (Boden-Spezialist)",
  wrestler: "Wrestler (Takedown-fokussiert)",
  "all-rounder": "All-Rounder",
  "bjj-specialist": "BJJ-Spezialist (Submissions)",
  kickboxer: "Kickboxer (Kicks/Knees)",
  "pressure-fighter": "Pressure-Fighter (vorwärts, aggressiv)",
  "counter-striker": "Counter-Striker (Konter)",
};

// ─── Phasen ────────────────────────────────────────────────────────────────

export type FightCampPhase =
  | "foundation"
  | "specific-prep"
  | "sparring-simulation"
  | "taper";

export const PHASE_LABEL: Record<FightCampPhase, string> = {
  foundation: "Aufbauphase",
  "specific-prep": "Schwerpunktphase",
  "sparring-simulation": "Sparring & Simulation",
  taper: "Taper / Tapering",
};

export const PHASE_FOCUS: Record<FightCampPhase, string> = {
  foundation: "Grundlagen-Konditionierung, Volumen, Technik-Reps",
  "specific-prep": "Gegnerspezifische Schwerpunkte, Gameplan-Drills",
  "sparring-simulation": "Hartes Sparring, Kampfsimulation, Strategie unter Druck",
  taper: "Belastung reduzieren, Schärfe halten, Erholung priorisieren",
};

// ─── Datenmodell ───────────────────────────────────────────────────────────

export interface OpponentProfile {
  name: string;
  /** Hauptstil */
  style: FightStyle;
  stance: FighterStance;
  heightCm?: number | null;
  weightKg?: number | null;
  reachCm?: number | null;
  /** Allgemeine Stärken — kurze Stichpunkte */
  strengths: string[];
  /** Schwächen / Lücken im Spiel */
  weaknesses: string[];
  /** Bevorzugte Angriffe — kurze Stichpunkte */
  favoriteAttacks: string[];
  /** Frei-Notizen */
  notes?: string;
}

export interface FightCampPhaseBlock {
  phase: FightCampPhase;
  startsAt: Date;
  endsAt: Date;
  /** Wochen-Anzahl in dieser Phase */
  weeks: number;
  /** Fokus-Beschreibung */
  focus: string;
  /** Empfohlene Techniken (technique-IDs) */
  techniqueIds: string[];
  /** Empfohlene Übungen (exercise-IDs) */
  exerciseIds: string[];
  /** Empfohlene Trainingsbereiche dieser Phase */
  trainingAreas: TrainingArea[];
  /** Kategorien-Schwerpunkt */
  categories: Category[];
  /** Empfohlene Sessions pro Woche */
  sessionsPerWeek: number;
  /** Sparring-Anteil (0..1) — wie oft Sparring-Element vorgesehen ist */
  sparringRatio: number;
  /** Trainer-Notizen für diese Phase (editierbar) */
  notes?: string;
}

export interface FightCamp {
  id: string;
  studentUid: string;
  /** Wer das Camp angelegt hat (uid) */
  createdBy: string;
  createdAt: Date;
  /** Wann der Kampf ist */
  competitionDate: Date;
  competitionName: string;
  /** Wie viele Wochen Vorbereitung */
  weeksTotal: number;
  /** Wann gestartet wurde (Default: heute) */
  startedAt: Date;
  opponent: OpponentProfile;
  phases: FightCampPhaseBlock[];
  /** Status — aktiv / abgeschlossen / archiviert */
  status: "active" | "completed" | "archived";
  /** Gesamt-Notizen vom Trainer */
  trainerNotes?: string;
  isDemo?: boolean;
}

// ─── Firestore-Helpers ─────────────────────────────────────────────────────

function fightCampsCol(uid: string) {
  return collection(getFirestoreDb(), "users", uid, "fightCamps");
}

function fightCampDoc(uid: string, campId: string) {
  return doc(getFirestoreDb(), "users", uid, "fightCamps", campId);
}

// ─── Encode / Decode für Firestore ─────────────────────────────────────────

type PhaseDoc = {
  phase: FightCampPhase;
  startsAt: Timestamp;
  endsAt: Timestamp;
  weeks: number;
  focus: string;
  techniqueIds: string[];
  exerciseIds: string[];
  trainingAreas: TrainingArea[];
  categories: Category[];
  sessionsPerWeek: number;
  sparringRatio: number;
  notes?: string;
};

type FightCampDoc = {
  studentUid: string;
  createdBy: string;
  createdAt?: Timestamp;
  competitionDate: Timestamp;
  competitionName: string;
  weeksTotal: number;
  startedAt: Timestamp;
  opponent: OpponentProfile;
  phases: PhaseDoc[];
  status: "active" | "completed" | "archived";
  trainerNotes?: string;
  isDemo?: boolean;
};

function decode(snap: { id: string; data: () => FightCampDoc }): FightCamp {
  const d = snap.data();
  return {
    id: snap.id,
    studentUid: d.studentUid,
    createdBy: d.createdBy,
    createdAt: d.createdAt?.toDate() ?? new Date(),
    competitionDate: d.competitionDate.toDate(),
    competitionName: d.competitionName,
    weeksTotal: d.weeksTotal,
    startedAt: d.startedAt.toDate(),
    opponent: d.opponent,
    phases: d.phases.map((p) => ({
      phase: p.phase,
      startsAt: p.startsAt.toDate(),
      endsAt: p.endsAt.toDate(),
      weeks: p.weeks,
      focus: p.focus,
      techniqueIds: p.techniqueIds,
      exerciseIds: p.exerciseIds,
      trainingAreas: p.trainingAreas,
      categories: p.categories,
      sessionsPerWeek: p.sessionsPerWeek,
      sparringRatio: p.sparringRatio,
      notes: p.notes,
    })),
    status: d.status,
    trainerNotes: d.trainerNotes,
    isDemo: d.isDemo,
  };
}

function encode(camp: Omit<FightCamp, "id" | "createdAt">): FightCampDoc {
  return {
    studentUid: camp.studentUid,
    createdBy: camp.createdBy,
    competitionDate: Timestamp.fromDate(camp.competitionDate),
    competitionName: camp.competitionName,
    weeksTotal: camp.weeksTotal,
    startedAt: Timestamp.fromDate(camp.startedAt),
    opponent: camp.opponent,
    phases: camp.phases.map((p) => ({
      phase: p.phase,
      startsAt: Timestamp.fromDate(p.startsAt),
      endsAt: Timestamp.fromDate(p.endsAt),
      weeks: p.weeks,
      focus: p.focus,
      techniqueIds: p.techniqueIds,
      exerciseIds: p.exerciseIds,
      trainingAreas: p.trainingAreas,
      categories: p.categories,
      sessionsPerWeek: p.sessionsPerWeek,
      sparringRatio: p.sparringRatio,
      notes: p.notes,
    })),
    status: camp.status,
    trainerNotes: camp.trainerNotes,
    isDemo: camp.isDemo,
  };
}

// ─── CRUD ──────────────────────────────────────────────────────────────────

export async function createFightCamp(
  camp: Omit<FightCamp, "id" | "createdAt">,
): Promise<FightCamp> {
  const ref = doc(fightCampsCol(camp.studentUid));
  await setDoc(ref, {
    ...encode(camp),
    createdAt: serverTimestamp(),
  });
  return { ...camp, id: ref.id, createdAt: new Date() };
}

export async function updateFightCamp(
  uid: string,
  campId: string,
  patch: Partial<Omit<FightCamp, "id" | "createdAt" | "studentUid">>,
): Promise<void> {
  const data: Partial<FightCampDoc> = {};
  if (patch.createdBy !== undefined) data.createdBy = patch.createdBy;
  if (patch.competitionDate !== undefined)
    data.competitionDate = Timestamp.fromDate(patch.competitionDate);
  if (patch.competitionName !== undefined)
    data.competitionName = patch.competitionName;
  if (patch.weeksTotal !== undefined) data.weeksTotal = patch.weeksTotal;
  if (patch.startedAt !== undefined)
    data.startedAt = Timestamp.fromDate(patch.startedAt);
  if (patch.opponent !== undefined) data.opponent = patch.opponent;
  if (patch.phases !== undefined) {
    data.phases = patch.phases.map((p) => ({
      phase: p.phase,
      startsAt: Timestamp.fromDate(p.startsAt),
      endsAt: Timestamp.fromDate(p.endsAt),
      weeks: p.weeks,
      focus: p.focus,
      techniqueIds: p.techniqueIds,
      exerciseIds: p.exerciseIds,
      trainingAreas: p.trainingAreas,
      categories: p.categories,
      sessionsPerWeek: p.sessionsPerWeek,
      sparringRatio: p.sparringRatio,
      notes: p.notes,
    }));
  }
  if (patch.status !== undefined) data.status = patch.status;
  if (patch.trainerNotes !== undefined) data.trainerNotes = patch.trainerNotes;
  if (patch.isDemo !== undefined) data.isDemo = patch.isDemo;
  await setDoc(fightCampDoc(uid, campId), data, { merge: true });
}

export async function getFightCamp(
  uid: string,
  campId: string,
): Promise<FightCamp | null> {
  const snap = await getDoc(fightCampDoc(uid, campId));
  if (!snap.exists()) return null;
  return decode({ id: snap.id, data: () => snap.data() as FightCampDoc });
}

export async function listFightCamps(uid: string): Promise<FightCamp[]> {
  try {
    const q = query(fightCampsCol(uid), orderBy("competitionDate", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) =>
      decode({ id: d.id, data: () => d.data() as FightCampDoc }),
    );
  } catch {
    // Falls Index fehlt — Fallback ohne orderBy
    const snap = await getDocs(fightCampsCol(uid));
    return snap.docs.map((d) =>
      decode({ id: d.id, data: () => d.data() as FightCampDoc }),
    );
  }
}

export async function deleteFightCamp(
  uid: string,
  campId: string,
): Promise<void> {
  await deleteDoc(fightCampDoc(uid, campId));
}

// ─── Hilfsmittel: Phasen-Zeitachse ─────────────────────────────────────────

/**
 * Verteilt die Camp-Wochen auf 4 Phasen.
 * Default-Split: 40% Aufbau / 30% Schwerpunkt / 20% Sparring / 10% Taper.
 * Bei sehr kurzen Camps (<6 Wochen) wird das Taper-Minimum auf 1 Woche begrenzt.
 */
export function distributePhaseWeeks(weeksTotal: number): Record<
  FightCampPhase,
  number
> {
  if (weeksTotal <= 4) {
    return {
      foundation: 1,
      "specific-prep": 1,
      "sparring-simulation": 1,
      taper: 1,
    };
  }
  const taper = 1;
  const remaining = weeksTotal - taper;
  const sparring = Math.max(1, Math.round(remaining * 0.25));
  const specific = Math.max(1, Math.round(remaining * 0.35));
  const foundation = remaining - sparring - specific;
  return {
    foundation: Math.max(1, foundation),
    "specific-prep": specific,
    "sparring-simulation": sparring,
    taper,
  };
}

/**
 * Berechnet den Fortschritt eines Camps (0..1) basierend auf
 * Wochen-Position relativ zu startedAt + weeksTotal.
 */
export function fightCampProgress(camp: FightCamp): {
  ratio: number;
  daysRemaining: number;
  currentPhase: FightCampPhase | null;
} {
  const now = Date.now();
  const start = camp.startedAt.getTime();
  const end = camp.competitionDate.getTime();
  const ratio = Math.max(0, Math.min(1, (now - start) / Math.max(1, end - start)));
  const daysRemaining = Math.max(
    0,
    Math.ceil((end - now) / (24 * 3600 * 1000)),
  );
  const currentPhase =
    camp.phases.find(
      (p) => p.startsAt.getTime() <= now && p.endsAt.getTime() > now,
    )?.phase ?? null;
  return { ratio, daysRemaining, currentPhase };
}
