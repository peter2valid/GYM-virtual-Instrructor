"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "development") {
        // Unregister any stale service workers in development to stop caching bugs
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
          }
        });
      } else {
        navigator.serviceWorker
          .register("/sw.js")
          .catch(() => {
            // SW registration is best-effort — silently ignore failures
          });
      }
    }
  }, []);

  return null;
}
