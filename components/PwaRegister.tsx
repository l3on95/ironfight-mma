"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => {
          // SW-Fehler still ignorieren — App funktioniert ohne
          console.warn("[IronFight SW]", err);
        });
    });
  }, []);

  return null;
}
