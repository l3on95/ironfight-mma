import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { getFirestoreDb } from "./firebase";
import type { TimerConfig } from "./use-workout-timer";

export type WorkoutSession = {
  id: string;
  label: string | null;
  rounds: number;
  workSeconds: number;
  restSeconds: number;
  completedAt: Date;
  totalWorkSeconds: number;
};

type WorkoutDoc = {
  label: string | null;
  rounds: number;
  workSeconds: number;
  restSeconds: number;
  completedAt: Timestamp | null;
  totalWorkSeconds: number;
};

function workoutsCol(userId: string) {
  return collection(getFirestoreDb(), "users", userId, "workouts");
}

export async function logWorkout(
  userId: string,
  config: TimerConfig,
  label: string | null,
) {
  const totalWorkSeconds = config.rounds * config.workSeconds;
  await addDoc(workoutsCol(userId), {
    label,
    rounds: config.rounds,
    workSeconds: config.workSeconds,
    restSeconds: config.restSeconds,
    completedAt: serverTimestamp(),
    totalWorkSeconds,
  });
}

export async function getRecentWorkouts(
  userId: string,
  count = 10,
): Promise<WorkoutSession[]> {
  const q = query(
    workoutsCol(userId),
    orderBy("completedAt", "desc"),
    limit(count),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as WorkoutDoc;
    return {
      id: d.id,
      label: data.label,
      rounds: data.rounds,
      workSeconds: data.workSeconds,
      restSeconds: data.restSeconds,
      completedAt: data.completedAt?.toDate() ?? new Date(),
      totalWorkSeconds: data.totalWorkSeconds,
    };
  });
}

export type WorkoutStats = {
  total: number;
  thisWeek: number;
  streak: number;
  lastLabel: string | null;
};

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function computeStats(sessions: WorkoutSession[]): WorkoutStats {
  const total = sessions.length;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisWeek = sessions.filter((s) => s.completedAt >= sevenDaysAgo).length;

  const days = new Set(sessions.map((s) => dayKey(s.completedAt)));
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!days.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const lastLabel = sessions[0]?.label ?? null;
  return { total, thisWeek, streak, lastLabel };
}
