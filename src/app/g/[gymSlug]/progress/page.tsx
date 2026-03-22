import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTenantBySlug } from "@/features/tenants/queries";
import { getAuthUser } from "@/features/auth/actions";
import { getMemberStats } from "@/features/sessions/queries";
import { WeeklyActivityChart } from "@/components/charts/WeeklyActivityChart";
import { STAT_ICONS, getCategoryIcon } from "@/lib/utils/gym-icons";

interface Props {
  params: Promise<{ gymSlug: string }>;
}

export const metadata = { title: "My Progress" };

export default async function ProgressPage({ params }: Props) {
  const { gymSlug } = await params;

  const [tenant, user] = await Promise.all([
    getTenantBySlug(gymSlug),
    getAuthUser(),
  ]);

  if (!tenant) notFound();

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Sign in to track your progress.
          </p>
          <Link
            href={`/login?next=/g/${gymSlug}/progress`}
            className="inline-flex h-10 items-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const stats = await getMemberStats(user.id, tenant.id);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-4">
          <Link
            href={`/g/${gymSlug}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition-colors hover:bg-accent"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <p className="text-sm font-semibold text-foreground">My Progress</p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-6 pb-24">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            value={String(stats.totalSessions)}
            label="Total Workouts"
            icon={STAT_ICONS.workouts}
          />
          <StatCard
            value={stats.totalMinutes > 0 ? `${stats.totalMinutes}` : "0"}
            label="Total Minutes"
            icon={STAT_ICONS.minutes}
          />
          <StatCard
            value={stats.currentStreak > 0 ? `${stats.currentStreak}` : "0"}
            label="Day Streak 🔥"
            icon={STAT_ICONS.streak}
          />
          <StatCard
            value={stats.favoriteCategory ?? "—"}
            label="Favourite Category"
            icon={stats.favoriteCategory ? getCategoryIcon(stats.favoriteCategory) : STAT_ICONS.trophy}
            small
          />
        </div>

        {/* Weekly activity chart */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Weekly Activity
          </p>
          {stats.totalSessions > 0 ? (
            <WeeklyActivityChart data={stats.weeklyData} />
          ) : (
            <div className="flex h-40 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Complete a workout to see your chart.
              </p>
            </div>
          )}
        </div>

        {/* CTA */}
        <Link
          href={`/g/${gymSlug}/workouts`}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Start a Workout
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  value,
  label,
  icon: Icon,
  small = false,
}: {
  value: string;
  label: string;
  icon?: React.ElementType;
  small?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4 text-center">
      {Icon && (
        <Icon className="mx-auto mb-2 h-7 w-7 text-muted-foreground" />
      )}
      <p className={`font-bold text-foreground ${small ? "text-lg" : "text-2xl"}`}>
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
