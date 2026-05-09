"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import Skeleton from "@/components/ui/Skeleton";

/**
 * Schützt eine Route — nur Trainer und Admins dürfen passieren.
 * Nicht-eingeloggte → /login, normale User → /dashboard.
 *
 * Hinweis Datenschutz: Dieser Guard ist eine UI-Schicht. Verlasse dich
 * NICHT allein darauf, sondern setze auch passende Firestore-Regeln,
 * damit Trainer per Rolle Lese-Zugriff auf die `users`-Collection
 * (und ggf. Sub-Collections) haben.
 */
export default function TrainerRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, profileLoading } = useAuth();
  const router = useRouter();

  const isReady = !loading && !profileLoading;
  const isTrainer = profile?.role === "trainer" || profile?.role === "admin";

  useEffect(() => {
    if (!isReady) return;
    if (!user) { router.replace("/login"); return; }
    if (!isTrainer) { router.replace("/dashboard"); }
  }, [isReady, user, isTrainer, router]);

  if (!isReady) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="space-y-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      </div>
    );
  }

  if (!user || !isTrainer) return null;

  return <>{children}</>;
}
