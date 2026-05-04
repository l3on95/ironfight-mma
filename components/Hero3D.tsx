"use client";

import dynamic from "next/dynamic";

const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-xs uppercase tracking-widest text-foreground/40">
        Lade Cage…
      </div>
    </div>
  ),
});

export default function Hero3D() {
  return (
    <div className="absolute inset-0">
      <HeroScene />
    </div>
  );
}
