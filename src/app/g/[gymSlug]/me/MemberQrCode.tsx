"use client";

import { useState } from "react";
import { QrCode, X } from "lucide-react";

interface Props {
  qrUrl: string;
  memberName: string;
  gymName: string;
}

export function MemberQrCode({ qrUrl, memberName, gymName }: Props) {
  const [open, setOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  async function handleOpen() {
    setOpen(true);
    if (!imgSrc) {
      // Generate QR via a free CDN-style API (client-side, no server needed)
      const encoded = encodeURIComponent(qrUrl);
      setImgSrc(
        `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encoded}`
      );
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex w-full items-center gap-4 rounded-3xl bg-card p-4 pr-6 shadow-badge ring-1 ring-border/5 transition-all hover:shadow-pill active:scale-[0.98]"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
          <QrCode className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[15px] font-black text-foreground">My Check-In QR</p>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">Show at the door to check in</p>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          <div className="relative w-full max-w-xs rounded-[2.5rem] bg-card p-8 shadow-2xl text-center">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-5 space-y-1">
              <h2 className="text-lg font-black text-foreground">{memberName}</h2>
              <p className="text-sm text-muted-foreground">{gymName}</p>
            </div>

            <div className="mx-auto flex h-60 w-60 items-center justify-center rounded-2xl bg-white p-3 shadow-inner">
              {imgSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imgSrc} alt="Your check-in QR code" className="h-full w-full" />
              ) : (
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              )}
            </div>

            <p className="mt-5 text-xs text-muted-foreground leading-relaxed">
              Show this to the front desk or scan at the entrance.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
