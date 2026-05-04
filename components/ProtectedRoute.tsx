"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-32 sm:px-6">
        <div className="text-center text-sm uppercase tracking-widest text-foreground/60">
          {loading ? "Lade Session…" : "Weiterleitung zum Login…"}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
