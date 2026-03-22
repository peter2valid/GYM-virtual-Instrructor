"use client";

/**
 * Haptic feedback via Vibration API — supported on Android Chrome.
 * Silently no-ops on unsupported platforms (iOS Safari, desktop).
 */
export function useHaptic() {
  function tap() {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(8);
    }
  }

  function success() {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
  }

  function error() {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([30, 30, 30]);
    }
  }

  return { tap, success, error };
}
