import { redirect } from "next/navigation";
import { getAuthUser } from "@/features/auth/actions";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { getTenantAnalyticsData } from "@/features/sessions/queries";
import { WeeklyActivityChart } from "@/components/charts/WeeklyActivityChart";

export const metadata = { title: "Analytics" };

export default async function GymAdminAnalyticsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login?next=/gym-admin/analytics");

  const client = await createServerSupabaseClient();
  const { data: profile } = await client
    .from("profiles")
    .select("tenant_id, role")
    .eq("id", user.id)
    .single();

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Sessions (90 days)"
          value={data.totalSessions.toLocaleString()}
          sub="completed workouts"
        />
        <StatCard
          label="Minutes Logged"
          value={data.totalMinutes.toLocaleString()}
          sub="across all members"
        />
        <StatCard
          label="Completion Rate"
          value={`${data.completionRate}%`}
          sub="started → finished"
        />
        <StatCard
          label="Active this month"
          value={data.activeThisMonth.toLocaleString()}
          sub={retentionLabel}
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
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Most Popular Workouts</p>
            <p className="text-xs text-muted-foreground">Last 90 days</p>
          </div>
          <div className="divide-y divide-border">
            <div className="grid grid-cols-[1fr_80px_80px_100px] px-4 py-2 text-xs font-medium text-muted-foreground">
              <span>Workout</span>
              <span className="text-right">Category</span>
              <span className="text-right">Sessions</span>
              <span className="text-right">Completion</span>
            </div>
            {data.popularWorkouts.map((w, i) => (
              <div
                key={w.workoutId}
                className="grid grid-cols-[1fr_80px_80px_100px] items-center px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-5 flex-shrink-0 text-xs font-bold text-muted-foreground/50">
                    {i + 1}
                  </span>
                  <span className="truncate text-sm font-medium text-foreground">
                    {w.title}
                  </span>
                </div>
                <span className="text-right text-xs text-muted-foreground capitalize">
                  {w.category}
                </span>
                <span className="text-right text-sm text-foreground">
                  {w.sessionCount}
                </span>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-muted-foreground">{w.completionRate}%</span>
                  <div className="h-1 w-16 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Active members this month</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{data.activeThisMonth}</p>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
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
            <span className="text-xs text-muted-foreground">
              {data.activePrevMonth} prev
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Member retention trend</p>
          <p
            className={`mt-1 text-2xl font-bold ${
              data.retentionChange >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-destructive"
            }`}
          >
            {data.retentionChange >= 0 ? "+" : ""}{data.retentionChange}%
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Month-over-month active member change
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
