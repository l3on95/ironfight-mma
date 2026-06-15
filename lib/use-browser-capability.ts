import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/** Liest einen statischen Browser-Wert SSR-sicher nach der Hydration. */
export function useBrowserCapability<T>(getSnapshot: () => T, serverFallback: T): T {
  return useSyncExternalStore(emptySubscribe, getSnapshot, () => serverFallback);
}
