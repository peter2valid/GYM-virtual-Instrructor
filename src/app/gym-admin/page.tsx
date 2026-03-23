import { redirect } from "next/navigation";
import { getAuthUser } from "@/features/auth/actions";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { getTenantStats, getTenantRecentSessions } from "@/features/sessions/queries";
import { getCategoryIcon, STAT_ICONS } from "@/lib/utils/gym-icons";
import { StatsCard } from "@/components/ui/StatsCard";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";

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
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <StatsCard
            key={card.label}
            label={card.label}
            value={card.value}
            icon={card.icon}
          />
        ))}
      </div>

      {/* Recent sessions */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <p className="text-base font-semibold text-foreground tracking-tight">Recent Sessions</p>
          <Link
            href={ROUTES.GYM_ADMIN_ANALYTICS}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            View More <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {recentSessions.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No sessions recorded yet.
          </p>
        ) : (
          <div className="divide-y divide-border/50">
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
                <div key={s.id} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-black/5 dark:hover:bg-white/5">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-primary/10 flex flex-col items-center justify-center text-primary group transition-all">
                      {(() => {
                        const Icon = getCategoryIcon(s.workoutCategory ?? "");
                        return <Icon className="h-5 w-5" />;
                      })()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground leading-tight">{s.workoutTitle}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
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
