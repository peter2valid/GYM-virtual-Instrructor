import { StatsCardSkeleton } from "@/components/ui/StatsCard";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-4 w-64 rounded bg-muted" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>

      {/* Chart Skeleton */}
      <div className="h-[350px] w-full rounded-2xl border border-border bg-muted/20" />

      {/* Table Skeleton */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <div className="h-5 w-48 rounded bg-muted" />
        </div>
        <div className="divide-y divide-border/50">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="grid grid-cols-[1fr_100px_100px_120px] px-6 py-4 items-center">
              <div className="flex items-center gap-4">
                <div className="h-4 w-4 rounded bg-muted" />
                <div className="h-4 w-48 rounded bg-muted" />
              </div>
              <div className="h-4 w-16 ml-auto rounded bg-muted" />
              <div className="h-4 w-12 ml-auto rounded bg-muted" />
              <div className="flex flex-col items-end gap-1.5 ml-auto">
                <div className="h-3 w-8 rounded bg-muted" />
                <div className="h-1.5 w-20 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
