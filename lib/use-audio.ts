import { useSyncExternalStore } from "react";
import { isAudioUnlocked, subscribeAudioUnlocked } from "@/lib/audio";

/** Reaktiver Lese-Zugriff auf den globalen Audio-Unlock-Status (SSR-sicher). */
export function useAudioUnlocked(): boolean {
  return useSyncExternalStore(subscribeAudioUnlocked, isAudioUnlocked, () => false);
}
