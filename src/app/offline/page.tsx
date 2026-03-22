"use client";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="space-y-4">
        <div className="text-5xl">📵</div>
        <h1 className="text-xl font-bold text-foreground">You&apos;re offline</h1>
        <p className="text-sm text-muted-foreground">
          No internet connection. Previously viewed workouts are still available.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}
