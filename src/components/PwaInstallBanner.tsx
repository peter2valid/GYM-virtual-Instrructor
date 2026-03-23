"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Share, Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type InstallMode = "native" | "ios" | null;

const DISMISSED_KEY = "pwa-banner-dismissed-v2";

export function PwaInstallBanner() {
  const [mode, setMode] = useState<InstallMode>(null);
  const [nativePrompt, setNativePrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();

  // Hide during active workout — never interrupt the session
  const isWorkoutActive =
    pathname.includes("/session") || /\/workouts\/[^/]+$/.test(pathname);

  useEffect(() => {
    // Already installed as PWA
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    // Already dismissed by this user
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const ua = navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(ua) && !/crios|fxios/i.test(ua);
    const isAndroidOrDesktop = !isIOS;

    if (isIOS) {
      // iOS Safari: no beforeinstallprompt — show manual instructions
      setMode("ios");
      setTimeout(() => setVisible(true), 3500);
      return;
    }

    if (isAndroidOrDesktop) {
      // Chrome / Edge / Samsung Internet / desktop — wait for browser prompt
      const handler = (e: Event) => {
        e.preventDefault();
        setNativePrompt(e as BeforeInstallPromptEvent);
        setMode("native");
        setTimeout(() => setVisible(true), 3500);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }
  }, []);

  function dismiss() {
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, "1");
  }

  async function handleNativeInstall() {
    if (!nativePrompt) return;
    await nativePrompt.prompt();
    const { outcome } = await nativePrompt.userChoice;
    if (outcome === "accepted") dismiss();
  }

  if (!mode || dismissed || !visible || isWorkoutActive) return null;

  return (
    <div className="fixed bottom-[4.5rem] left-3 right-3 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4 duration-300">
      <div className="rounded-2xl border border-border bg-card shadow-xl ring-1 ring-black/5">
        {/* Header row */}
        <div className="flex items-start gap-3 p-4 pb-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-base font-black shadow-sm">
            G
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground leading-snug">
              Install VirtualGYM
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
              {mode === "ios"
                ? "Add to your home screen for the full app experience — works offline too."
                : "Install for instant access, offline workouts, and a full-screen experience."}
            </p>
          </div>
          <button
            onClick={dismiss}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* iOS step-by-step instructions */}
        {mode === "ios" && (
          <div className="border-t border-border mx-4 pt-3 pb-4 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              How to install on iPhone / iPad
            </p>
            {[
              { icon: <Share className="h-4 w-4 flex-shrink-0 text-blue-500" />, text: "Tap the Share button in Safari's toolbar" },
              { icon: <span className="h-4 w-4 flex-shrink-0 flex items-center justify-center rounded bg-muted text-[10px] font-bold">+</span>, text: 'Scroll down and tap "Add to Home Screen"' },
              { icon: <span className="h-4 w-4 flex-shrink-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold">✓</span>, text: 'Tap "Add" — done!' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-foreground">
                {step.icon}
                <span className="text-xs text-muted-foreground">{step.text}</span>
              </div>
            ))}
            <button
              onClick={dismiss}
              className="mt-3 w-full rounded-xl border border-border py-2 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
            >
              Got it
            </button>
          </div>
        )}

        {/* Native install button (Android / Desktop) */}
        {mode === "native" && (
          <div className="flex gap-2 border-t border-border p-3">
            <button
              onClick={handleNativeInstall}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.98]"
            >
              <Download className="h-4 w-4" />
              Install App
            </button>
            <button
              onClick={dismiss}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
            >
              Not now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
