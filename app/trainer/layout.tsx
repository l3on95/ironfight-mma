"use client";

import TrainerRoute from "@/components/TrainerRoute";
import TrainerSubnav from "@/components/trainer/TrainerSubnav";

/**
 * Layout für den gesamten Trainerbereich: Guard + Bereichs-Navigation an
 * EINER Stelle — die einzelnen Seiten brauchen kein eigenes <TrainerRoute>.
 */
export default function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TrainerRoute>
      <TrainerSubnav />
      {children}
    </TrainerRoute>
  );
}
