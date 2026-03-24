"use client";

import { useEffect, useState } from "react";

export type ConnectionQuality = "fast" | "slow" | "offline";

interface ConnectionState {
  quality: ConnectionQuality;
  saveData: boolean;
  isOnline: boolean;
}

/**
 * Returns the current network quality so components can adapt their behavior.
 *
 * fast   — 4g or unknown (default assumption)
 * slow   — 2g / slow-2g / 3g
 * offline — navigator.onLine is false
 *
 * Usage:
 *   const { quality, saveData } = useConnection()
 *   // Show static placeholder instead of GIF on slow connections
 *   if (quality === 'slow' || saveData) return <StaticFrame />
 */
export function useConnection(): ConnectionState {
  const [state, setState] = useState<ConnectionState>(() => getState());

  useEffect(() => {
    function update() {
      setState(getState());
    }

    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    // NetworkInformation API (Chrome/Android, not available in Safari/Firefox)
    const conn = getNetworkInfo();
    conn?.addEventListener("change", update);

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      conn?.removeEventListener("change", update);
    };
  }, []);

  return state;
}

function getNetworkInfo(): EventTarget | null {
  if (typeof navigator === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (navigator as any).connection ?? (navigator as any).mozConnection ?? null;
}

function getState(): ConnectionState {
  if (typeof window === "undefined") {
    return { quality: "fast", saveData: false, isOnline: true };
  }

  if (!navigator.onLine) {
    return { quality: "offline", saveData: false, isOnline: false };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conn = (navigator as any).connection;
  const effectiveType: string = conn?.effectiveType ?? "4g";
  const saveData: boolean = conn?.saveData ?? false;

  const slow = effectiveType === "slow-2g" || effectiveType === "2g" || effectiveType === "3g";

  return {
    quality: slow ? "slow" : "fast",
    saveData,
    isOnline: true,
  };
}
