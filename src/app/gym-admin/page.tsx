import { redirect } from "next/navigation";
import { getAuthUser } from "@/features/auth/actions";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { getTenantStats, getTenantRecentSessions } from "@/features/sessions/queries";
import { getCategoryIcon, STAT_ICONS } from "@/lib/utils/gym-icons";

export const metadata = { title: "Gym Dashboard" };

export default async function GymAdminDashboard() {
  const user = await getAuthUser();
  if (!user) redirect("/login?next=/gym-admin");

  // Get admin's profile to determine tenant
  const client = await createServerSupabaseClient();
  const { data: profile } = await client
    .from("profiles")
    .select("tenant_id, role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.tenant_id || !["gym_admin", "super_admin"].includes(profile.role ?? "")) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-muted-foreground">
          Your account is not associated with a gym. Contact your platform administrator.
        </p>
      </div>
    );
  }

  const [stats, recentSessions] = await Promise.all([
    getTenantStats(profile.tenant_id),
    getTenantRecentSessions(profile.tenant_id, 8),
  ]);

  const statCards = [
    { label: "Total Members",      value: stats.totalMembers.toLocaleString(),    icon: STAT_ICONS.members },
    { label: "Active Today",       value: stats.activeToday.toLocaleString(),     icon: STAT_ICONS.heartRate },
    { label: "Workouts This Week", value: stats.workoutsThisWeek.toLocaleString(), icon: STAT_ICONS.workouts },
    { label: "Completion Rate",    value: `${stats.completionRate}%`,             icon: STAT_ICONS.trophy },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back{profile.full_name ? `, ${profile.full_name}` : ""}.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              {(() => {
                const Icon = card.icon;
                return <Icon className="h-5 w-5" />;
              })()}
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Recent sessions */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Recent Sessions</p>
        </div>
        {recentSessions.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No sessions recorded yet.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {recentSessions.map((s) => {
              const date = s.completedAt
                ? new Date(s.completedAt).toLocaleDateString("en", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—";
              const dur = s.totalDurationSeconds
                ? `${Math.round(s.totalDurationSeconds / 60)} min`
                : null;
              return (
                <div key={s.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 flex-shrink-0 rounded-lg bg-muted p-1.5 flex flex-col items-center justify-center text-muted-foreground">
                      {(() => {
                        const Icon = getCategoryIcon(s.workoutCategory ?? "");
                        return <Icon className="h-full w-full" />;
                      })()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.workoutTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.workoutCategory} · {date}
                      </p>
                    </div>
                  </div>
                  {dur && (
                    <span className="text-xs text-muted-foreground">{dur}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
