export default function WorkoutsLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header skeleton */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-4">
          <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-20 animate-pulse rounded bg-muted" />
            <div className="h-3 w-28 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>

      {/* Category pills skeleton */}
      <div className="flex gap-2 overflow-hidden px-4 py-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-20 flex-shrink-0 animate-pulse rounded-full bg-muted" />
        ))}
      </div>

      {/* Workout cards skeleton */}
      <div className="mx-auto w-full max-w-2xl flex-1 space-y-3 px-4 pb-24 pt-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4">
            <div className="h-12 w-12 flex-shrink-0 animate-pulse rounded-xl bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 animate-pulse rounded bg-muted" />
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-6 w-12 animate-pulse rounded-md bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
