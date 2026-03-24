"use client";

import { useEffect, useRef, useState } from "react";
import { useConnection } from "@/hooks/use-connection";
import { exerciseLoopUrl, exerciseDemoUrl } from "@/lib/exercises/url";
import { cn } from "@/lib/utils/cn";

interface ExerciseGifProps {
  /** The exercise source_id (e.g. "Barbell_Curl") — matches the R2 folder name */
  exerciseId: string;
  /** "loop" = always use the small 208KB loop.gif (list cards)
   *  "demo" = prefer demo.gif, fall back to loop.gif (detail pages) */
  variant?: "loop" | "demo";
  alt: string;
  className?: string;
  /** Width in pixels — used for the placeholder aspect ratio */
  width?: number;
  height?: number;
}

/**
 * Connection-aware, lazily-loaded exercise GIF.
 *
 * Behavior:
 * - fast  connection → loads GIF automatically when scrolled into view
 * - slow  connection → shows static placeholder, loads GIF only on tap
 * - saveData=true    → same as slow
 * - offline          → shows placeholder, loads from SW cache on tap
 *
 * The blur placeholder is a pure CSS gradient so there's no extra request.
 */
export function ExerciseGif({
  exerciseId,
  variant = "loop",
  alt,
  className,
  width = 400,
  height = 267,
}: ExerciseGifProps) {
  const { quality, saveData } = useConnection();
  const isConstrained = quality === "slow" || quality === "offline" || saveData;

  const [src, setSrc] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [userRequested, setUserRequested] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const gifUrl =
    variant === "demo" ? exerciseDemoUrl(exerciseId) : exerciseLoopUrl(exerciseId);
  const fallbackUrl = exerciseLoopUrl(exerciseId);

  // Load GIF when in viewport (fast) or when user taps (slow)
  useEffect(() => {
    if (isConstrained && !userRequested) return;

    const el = containerRef.current;
    if (!el) return;

    // IntersectionObserver — don't even start the request until visible
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setSrc(gifUrl);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" } // start loading 200px before entering viewport
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [gifUrl, isConstrained, userRequested]);

  function handleError() {
    // If demo.gif 404s, fall back to loop.gif
    if (src === gifUrl && gifUrl !== fallbackUrl) {
      setSrc(fallbackUrl);
    } else {
      setError(true);
    }
  }

  const aspectRatio = `${(height / width) * 100}%`;

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden rounded-xl bg-muted", className)}
      style={{ paddingBottom: aspectRatio }}
      onClick={() => isConstrained && !userRequested && setUserRequested(true)}
    >
      {/* Placeholder shown before load and on error */}
      {(!loaded || error) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
          {isConstrained && !userRequested && !src && (
            // Tap-to-load indicator on slow connections
            <button
              type="button"
              className="flex flex-col items-center gap-1 text-muted-foreground/60 transition-opacity hover:text-muted-foreground"
              onClick={(e) => { e.stopPropagation(); setUserRequested(true); }}
            >
              <PlayIcon className="h-8 w-8" />
              <span className="text-[10px] font-medium uppercase tracking-wider">
                Tap to load
              </span>
            </button>
          )}
        </div>
      )}

      {/* Actual GIF — only rendered once we have a src */}
      {src && !error && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={handleError}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0"
          )}
        />
      )}
    </div>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8 5v14l11-7L8 5z" />
    </svg>
  );
}
