import { redirect } from "next/navigation";
import { getAuthUser } from "@/features/auth/actions";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { getTenantAnalyticsData } from "@/features/sessions/queries";
import { WeeklyActivityChart } from "@/components/charts/WeeklyActivityChart";
import { StatsCard } from "@/components/ui/StatsCard";
import { TrendingUp, TrendingDown, Users, Clock, CheckCircle2, Activity } from "lucide-react";

export const metadata = { title: "Analytics" };

export default async function GymAdminAnalyticsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login?next=/gym-admin/analytics");

  const client = await createServerSupabaseClient();
  const { data: profile } = await client
    .from("profiles")
    .select("tenant_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.tenant_id || !["gym_admin", "super_admin"].includes(profile.role ?? "")) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-muted-foreground">Access denied.</p>
      </div>
    );
  }

  const data = await getTenantAnalyticsData(profile.tenant_id);

  const retentionLabel =
    data.retentionChange > 0
      ? `+${data.retentionChange}% vs last month`
      : data.retentionChange < 0
      ? `${data.retentionChange}% vs last month`
      : "Same as last month";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Member activity and workout performance for your gym.
        </p>
      </div>

      {/* Key metrics */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Sessions (90 days)"
          value={data.totalSessions.toLocaleString()}
          description="completed workouts"
          icon={Activity}
        />
        <StatsCard
          label="Minutes Logged"
          value={data.totalMinutes.toLocaleString()}
          description="across all members"
          icon={Clock}
        />
        <StatsCard
          label="Completion Rate"
          value={`${data.completionRate}%`}
          description="started → finished"
          icon={CheckCircle2}
        />
        <StatsCard
          label="Active this month"
          value={data.activeThisMonth.toLocaleString()}
          icon={Users}
          trend={{
            value: Math.abs(data.retentionChange),
            label: "vs last month",
            isPositive: data.retentionChange >= 0
          }}
        />
      </div>

      {/* Weekly chart */}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="mb-1 text-sm font-semibold text-foreground">
          Completed Sessions — Last 8 Weeks
        </p>
        <p className="mb-4 text-xs text-muted-foreground">
          All members across your gym.
        </p>
        <WeeklyActivityChart data={data.weeklyData} />
      </div>

      {/* Popular workouts */}
      {data.popularWorkouts.length > 0 && (
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border px-6 py-4">
            <p className="text-base font-semibold text-foreground tracking-tight">Most Popular Workouts</p>
            <p className="text-xs text-muted-foreground mt-0.5">Last 90 days</p>
          </div>
          <div className="divide-y divide-border/50">
            <div className="grid grid-cols-[1fr_100px_100px_120px] px-6 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/30">
              <span>Workout</span>
              <span className="text-right">Category</span>
              <span className="text-right">Sessions</span>
              <span className="text-right">Completion</span>
            </div>
            {data.popularWorkouts.map((w, i) => (
              <div
                key={w.workoutId}
                className="grid grid-cols-[1fr_100px_100px_120px] items-center px-6 py-4 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="w-5 flex-shrink-0 text-sm font-bold text-muted-foreground/30">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="truncate text-sm font-semibold text-foreground">
                    {w.title}
                  </span>
                </div>
                <span className="text-right text-xs font-medium text-muted-foreground capitalize">
                  {w.category}
                </span>
                <span className="text-right text-sm font-bold text-foreground">
                  {w.sessionCount}
                </span>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-xs font-semibold text-foreground/80">{w.completionRate}%</span>
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted shadow-inner">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${w.completionRate}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Member retention */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-muted-foreground">Active members this month</p>
            <Users className="h-5 w-5 text-primary/50" />
          </div>
          <p className="text-3xl font-bold tracking-tight text-foreground">{data.activeThisMonth}</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted shadow-inner">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{
                  width: `${Math.min(
                    100,
                    data.activePrevMonth > 0
                      ? (data.activeThisMonth / data.activePrevMonth) * 100
                      : 100
                  )}%`,
                }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {data.activePrevMonth} prev
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-muted-foreground">Retention Performance</p>
            {data.retentionChange >= 0 ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-destructive" />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <p
              className={`text-3xl font-bold tracking-tight ${
                data.retentionChange >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-destructive"
              }`}
            >
              {data.retentionChange >= 0 ? "+" : ""}{data.retentionChange}%
            </p>
          </div>
          <p className="mt-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Month-over-month change
          </p>
        </div>
      </div>
    </div>
  );
}
