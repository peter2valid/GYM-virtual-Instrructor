"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import {
  processMemberScan,
  confirmCheckin,
  confirmCheckout,
  type MemberScanResult,
} from "@/features/members/scanner-actions";
import {
  CheckCircle2,
  XCircle,
  LogIn,
  LogOut,
  QrCode,
  Clock,
  CreditCard,
  AlertTriangle,
  User,
} from "lucide-react";

interface Props {
  gymId: string;
}

type ScanState =
  | { phase: "scanning" }
  | { phase: "loading" }
  | { phase: "result"; data: MemberScanResult }
  | { phase: "confirming" }
  | { phase: "done"; mode: "checkin" | "checkout" }
  | { phase: "error"; message: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseMemberQr(raw: string): { mid: string; sig: string; gymSlug?: string } | null {
  try {
    const url = new URL(raw);
    const mid = url.searchParams.get("mid");
    const sig = url.searchParams.get("sig");
    if (!mid || !sig) return null;
    return { mid, sig };
  } catch {
    return null;
  }
}

function formatDuration(from: string): string {
  const ms = Date.now() - new Date(from).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ScannerClient({ gymId }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const scanningRef = useRef(true);
  const [state, setState] = useState<ScanState>({ phase: "scanning" });
  const [cameraError, setCameraError] = useState<string | null>(null);

  // ── Start camera ────────────────────────────────────────────────────────────
  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;
    scanningRef.current = true;

    BrowserMultiFormatReader.listVideoInputDevices()
      .then((devices) => {
        if (devices.length === 0) {
          setCameraError("No camera found on this device.");
          return;
        }
        // Prefer back camera on mobile
        const backCam =
          devices.find((d) =>
            /back|rear|environment/i.test(d.label)
          ) ?? devices[devices.length - 1];

        reader.decodeFromVideoDevice(backCam.deviceId, videoRef.current!, (result, err) => {
          if (!scanningRef.current) return;
          if (result) {
            handleScan(result.getText());
          } else if (err && !(err instanceof NotFoundException)) {
            // Ignore NotFoundException (normal: no QR in frame yet)
          }
        });
      })
      .catch(() => setCameraError("Camera permission denied. Allow camera access and reload."));

    return () => {
      scanningRef.current = false;
      BrowserMultiFormatReader.releaseAllStreams();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Process scan ────────────────────────────────────────────────────────────
  const handleScan = useCallback(
    async (raw: string) => {
      if (!scanningRef.current) return;
      scanningRef.current = false; // pause scanning
      setState({ phase: "loading" });

      const parsed = parseMemberQr(raw);
      if (!parsed) {
        setState({ phase: "error", message: "Not a valid member QR code." });
        return;
      }

      const res = await processMemberScan(parsed.mid, parsed.sig, gymId);
      if (!res.ok) {
        setState({ phase: "error", message: res.error });
        return;
      }
      setState({ phase: "result", data: res.result });
    },
    [gymId]
  );

  // ── Confirm action ──────────────────────────────────────────────────────────
  async function handleConfirm() {
    if (state.phase !== "result") return;
    setState({ phase: "confirming" });

    const { mode, member, checkinId } = state.data;

    if (mode === "checkin") {
      const res = await confirmCheckin(member.id, gymId);
      if (!res.ok) { setState({ phase: "error", message: res.error }); return; }
    } else {
      if (!checkinId) { setState({ phase: "error", message: "No open check-in found." }); return; }
      const res = await confirmCheckout(checkinId, gymId);
      if (!res.ok) { setState({ phase: "error", message: res.error }); return; }
    }

    setState({ phase: "done", mode });
    setTimeout(resetScanner, 2500);
  }

  function resetScanner() {
    setState({ phase: "scanning" });
    scanningRef.current = true;
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-white overflow-hidden">

      {/* ── Camera viewfinder ─────────────────────────────────────────── */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover opacity-70"
        playsInline
        muted
      />

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-safe pt-6 pb-4">
        <div className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" />
          <span className="text-sm font-bold tracking-tight">Member Scanner</span>
        </div>
        <a
          href="/gym-admin"
          className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur-sm"
        >
          Exit
        </a>
      </div>

      {/* ── Scanning overlay ─────────────────────────────────────────── */}
      {state.phase === "scanning" && (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-6">
          {cameraError ? (
            <div className="rounded-2xl bg-destructive/20 border border-destructive/40 px-6 py-5 text-center">
              <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-destructive" />
              <p className="text-sm font-medium">{cameraError}</p>
            </div>
          ) : (
            <>
              {/* Viewfinder box */}
              <div className="relative flex h-64 w-64 items-center justify-center">
                {/* Corner brackets */}
                <div className="absolute inset-0">
                  {[
                    "top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl",
                    "top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl",
                    "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl",
                    "bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl",
                  ].map((cls, i) => (
                    <div key={i} className={`absolute h-10 w-10 border-primary ${cls}`} />
                  ))}
                </div>
                {/* Scan line */}
                <div className="absolute left-4 right-4 h-0.5 bg-primary/70 animate-scan-line shadow-[0_0_8px_2px_rgba(var(--primary-rgb,99,102,241),0.6)]" />
              </div>
              <p className="text-sm font-medium text-white/60 text-center">
                Point the camera at a member&apos;s QR code
              </p>
            </>
          )}
        </div>
      )}

      {/* ── Loading ───────────────────────────────────────────────────── */}
      {state.phase === "loading" && (
        <div className="relative z-10 flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-white/60">Looking up member…</p>
          </div>
        </div>
      )}

      {/* ── Confirming ────────────────────────────────────────────────── */}
      {state.phase === "confirming" && (
        <div className="relative z-10 flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-white/60">Processing…</p>
          </div>
        </div>
      )}

      {/* ── Done ─────────────────────────────────────────────────────── */}
      {state.phase === "done" && (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4 px-6">
          {state.mode === "checkin" ? (
            <CheckCircle2 className="h-20 w-20 text-green-400" strokeWidth={1.5} />
          ) : (
            <CheckCircle2 className="h-20 w-20 text-blue-400" strokeWidth={1.5} />
          )}
          <p className="text-2xl font-black tracking-tight">
            {state.mode === "checkin" ? "Checked In!" : "Checked Out!"}
          </p>
          <p className="text-sm text-white/50">Ready for next scan…</p>
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────────────── */}
      {state.phase === "error" && (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-5 px-6">
          <XCircle className="h-16 w-16 text-destructive" strokeWidth={1.5} />
          <div className="text-center">
            <p className="text-lg font-bold">Scan Failed</p>
            <p className="mt-1 text-sm text-white/50">{state.message}</p>
          </div>
          <button
            onClick={resetScanner}
            className="rounded-2xl bg-white/10 px-6 py-3 text-sm font-semibold backdrop-blur-sm hover:bg-white/20 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* ── Member result card (slides up) ───────────────────────────── */}
      {state.phase === "result" && (
        <div className="relative z-20 mt-auto w-full animate-slide-up">
          <div className="rounded-t-[2.5rem] bg-card px-6 pt-6 pb-safe pb-8 shadow-2xl">

            {/* Mode badge */}
            <div className="mb-5 flex justify-center">
              <div className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold ${
                state.data.mode === "checkin"
                  ? "bg-green-500/15 text-green-400"
                  : "bg-blue-500/15 text-blue-400"
              }`}>
                {state.data.mode === "checkin"
                  ? <><LogIn className="h-4 w-4" /> Check In</>
                  : <><LogOut className="h-4 w-4" /> Check Out</>
                }
              </div>
            </div>

            {/* Member identity */}
            <div className="flex items-center gap-4 mb-5">
              <div className="relative shrink-0">
                {state.data.member.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={state.data.member.avatarUrl}
                    alt={state.data.member.fullName}
                    className="h-20 w-20 rounded-[1.5rem] object-cover ring-2 ring-border"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-primary/10 text-2xl font-black text-primary ring-2 ring-border">
                    {state.data.member.firstName[0]}{state.data.member.lastName[0]}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 ring-2 ring-card">
                  <User className="h-3 w-3 text-white" />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-black text-foreground leading-tight truncate">
                  {state.data.member.fullName}
                </h2>
                {state.data.member.email && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {state.data.member.email}
                  </p>
                )}
                {state.data.member.phone && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {state.data.member.phone}
                  </p>
                )}
                {state.data.member.memberCode && (
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground/50">
                    #{state.data.member.memberCode}
                  </p>
                )}
              </div>
            </div>

            {/* Info grid */}
            <div className="mb-5 grid grid-cols-2 gap-3">
              {/* Membership */}
              <div className={`rounded-2xl p-3.5 ${
                state.data.membership
                  ? state.data.membership.daysLeft <= 7
                    ? "bg-orange-500/10 ring-1 ring-orange-500/20"
                    : "bg-primary/5 ring-1 ring-primary/10"
                  : "bg-muted/30 ring-1 ring-border/10"
              }`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <CreditCard className={`h-3.5 w-3.5 ${
                    state.data.membership
                      ? state.data.membership.daysLeft <= 7 ? "text-orange-500" : "text-primary"
                      : "text-muted-foreground/40"
                  }`} />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Membership
                  </p>
                </div>
                {state.data.membership ? (
                  <>
                    <p className="text-sm font-black text-foreground leading-tight">
                      {state.data.membership.planName}
                    </p>
                    <p className={`text-xs font-medium mt-0.5 ${
                      state.data.membership.daysLeft <= 7 ? "text-orange-500" : "text-muted-foreground"
                    }`}>
                      {state.data.membership.daysLeft === 0
                        ? "Expires today"
                        : `${state.data.membership.daysLeft}d left`}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-black text-foreground">No Plan</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Not subscribed</p>
                  </>
                )}
              </div>

              {/* Time info */}
              <div className="rounded-2xl bg-muted/30 p-3.5 ring-1 ring-border/10">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {state.data.mode === "checkout" ? "Time Inside" : "Last Visit"}
                  </p>
                </div>
                {state.data.mode === "checkout" && state.data.checkinAt ? (
                  <>
                    <p className="text-sm font-black text-foreground">
                      {formatDuration(state.data.checkinAt)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      In at {formatTime(state.data.checkinAt)}
                    </p>
                  </>
                ) : state.data.lastCheckin ? (
                  <>
                    <p className="text-sm font-black text-foreground">
                      {formatTime(state.data.lastCheckin.checkinAt)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(state.data.lastCheckin.checkinAt).toLocaleDateString("en", {
                        month: "short", day: "numeric"
                      })}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-black text-foreground">First visit</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Welcome!</p>
                  </>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleConfirm}
                className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black tracking-wide transition-all active:scale-[0.98] ${
                  state.data.mode === "checkin"
                    ? "bg-green-500 text-white shadow-lg shadow-green-500/30 hover:bg-green-600"
                    : "bg-blue-500 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-600"
                }`}
              >
                {state.data.mode === "checkin"
                  ? <><LogIn className="h-4 w-4" /> Confirm Check In</>
                  : <><LogOut className="h-4 w-4" /> Confirm Check Out</>
                }
              </button>
              <button
                onClick={resetScanner}
                className="rounded-2xl border border-border bg-muted/50 px-5 py-4 text-sm font-semibold text-muted-foreground hover:bg-accent transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
