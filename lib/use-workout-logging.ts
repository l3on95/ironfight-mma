"use client";

import { useEffect, useRef, useState } from "react";
import { logWorkout } from "@/lib/workouts";
import type { Phase, TimerConfig } from "@/lib/use-workout-timer";

export type WorkoutLogState = "idle" | "saving" | "saved" | "error";

export function useWorkoutLogging(
  phase: Phase,
  userId: string | null,
  config: TimerConfig,
  label: string | null,
): WorkoutLogState {
  const [logState, setLogState] = useState<WorkoutLogState>("idle");
  const loggedRef = useRef<symbol | null>(null);

  useEffect(() => {
    if (phase !== "done") {
      if (phase === "idle" || phase === "prep") loggedRef.current = null;
      return;
    }
    if (!userId) return;
    if (loggedRef.current) return;
    const token = Symbol("session");
    loggedRef.current = token;
    setLogState("saving");
    logWorkout(userId, config, label)
      .then(() => setLogState("saved"))
      .catch(() => { setLogState("error"); loggedRef.current = null; });
  }, [phase, userId, config, label]);

  return phase === "done" && userId ? logState : "idle";
}
