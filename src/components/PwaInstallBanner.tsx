"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  // Hide on session pages and workout detail pages — full-screen experience
  const isWorkoutActive =
    pathname.includes("/session") || /\/workouts\/[^/]+$/.test(pathname);

  useEffect(() => {
    // Don't show if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Don't show if user already dismissed
    if (localStorage.getItem("pwa-banner-dismissed")) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      // Delay the visual appearance by 4 seconds so it never blocks first interaction
      setTimeout(() => setVisible(true), 4000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setPrompt(null);
  }

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem("pwa-banner-dismissed", "1");
  }

  if (!prompt || dismissed || !visible || isWorkoutActive) return null;

  return (
    <div className="fixed bottom-[4.5rem] left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl border border-border bg-card p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground text-lg font-bold">
          G
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Add to Home Screen</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Install VirtualGYM for quick access and offline workouts.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground text-lg leading-none"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleInstall}
          className="flex-1 rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Install App
        </button>
        <button
          onClick={handleDismiss}
          className="rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-accent"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
