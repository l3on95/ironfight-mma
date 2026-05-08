"use client";

/**
 * Auto-Sync Komponente — läuft beim App-Start einmal pro User.
 * Holt für alle abonnierten Kurse die Techniken der aktuellen Woche
 * und legt sie in die persönliche Bibliothek.
 *
 * Nutzt `lastSyncedWeek` pro Subscription, um Doppel-Syncs innerhalb
 * derselben Woche zu vermeiden — ist also super günstig im Idle-Fall.
 */

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { syncSubscribedBlocks } from "@/lib/training-sessions";

export default function SubscriptionAutoSync() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    // Kurzer Delay, damit der Auth-Flow erst zur Ruhe kommt
    const t = setTimeout(() => {
      if (cancelled) return;
      syncSubscribedBlocks(user.uid).catch((err) => {
        console.warn("[IronFight] Subscription auto-sync failed:", err);
      });
    }, 1500);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [user]);

  return null;
}
