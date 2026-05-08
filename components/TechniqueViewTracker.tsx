"use client";

import { useEffect } from "react";
import { recordTechniqueView } from "@/lib/technique-analytics";

export function TechniqueViewTracker({ techniqueId }: { techniqueId: string }) {
  useEffect(() => {
    recordTechniqueView(techniqueId).catch(() => {});
  }, [techniqueId]);
  return null;
}
