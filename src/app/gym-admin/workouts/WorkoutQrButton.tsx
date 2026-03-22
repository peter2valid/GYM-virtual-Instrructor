"use client";

import { useState } from "react";
import { QrCode, X, Download } from "lucide-react";

interface Props {
  workoutId: string;
  workoutTitle: string;
  gymSlug: string;
}

export function WorkoutQrButton({ workoutId, workoutTitle, gymSlug }: Props) {
  const [open, setOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleOpen() {
    setOpen(true);
    if (qrDataUrl) return; // already loaded
    setLoading(true);
    try {
      const res = await fetch(`/api/workout-qr?gymSlug=${gymSlug}&workoutId=${workoutId}`);
      if (res.ok) {
        const { dataUrl } = await res.json();
        setQrDataUrl(dataUrl);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qr-${workoutTitle.replace(/\s+/g, "-").toLowerCase()}.png`;
    a.click();
  }

  return (
    <>
      <button
        onClick={handleOpen}
        title="Workout QR code"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <QrCode className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-xs rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <p className="mb-1 text-sm font-semibold text-foreground">Workout QR</p>
            <p className="mb-4 text-xs text-muted-foreground truncate">{workoutTitle}</p>

            <div className="flex justify-center rounded-xl bg-white p-4">
              {loading ? (
                <div className="flex h-48 w-48 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="Workout QR" width={192} height={192} />
              ) : (
                <div className="flex h-48 w-48 items-center justify-center">
                  <p className="text-xs text-muted-foreground">Failed to load</p>
                </div>
              )}
            </div>

            <p className="mt-3 break-all text-center font-mono text-[10px] text-muted-foreground">
              /g/{gymSlug}/workouts/{workoutId}
            </p>

            {qrDataUrl && (
              <button
                onClick={handleDownload}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                <Download className="h-4 w-4" />
                Download PNG
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
