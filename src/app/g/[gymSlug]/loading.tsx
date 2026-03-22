export default function GymHomeLoading() {
  return (
    <main className="w-full mx-auto max-w-2xl px-5 pb-24">
      {/* Top nav skeleton */}
      <div className="flex items-center justify-between py-6">
        <div className="h-5 w-28 animate-pulse rounded-md bg-muted" />
        <div className="h-7 w-20 animate-pulse rounded-full bg-muted" />
      </div>

      {/* Hero skeleton */}
      <div className="mb-10 mt-2 space-y-3">
        <div className="h-9 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-muted" />
        <div className="mt-5 h-[52px] w-full animate-pulse rounded-xl bg-muted" />
      </div>

      {/* Quick start skeleton */}
      <div className="mb-10 space-y-3">
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4">
            <div className="h-12 w-12 flex-shrink-0 animate-pulse rounded-xl bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>

      {/* Categories skeleton */}
      <div className="mb-10 space-y-3">
        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    </main>
  );
}
