import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ChevronRight, Flame } from "lucide-react";
import { getTenantBySlug } from "@/features/tenants/queries";
import { getAuthUser } from "@/features/auth/actions";
import {
  getQuickStartWorkoutsForTenant,
  getFeaturedWorkoutsForTenant,
  getCategoriesForTenant,
  getWorkoutsByTenant,
} from "@/features/workouts/queries";
import { getMemberStats } from "@/features/sessions/queries";
import { WorkoutCard } from "@/components/workout/WorkoutCard";
import { DIFFICULTY_STYLES, formatDuration } from "@/lib/utils/workout-ui";
import { getCategoryIcon } from "@/lib/utils/gym-icons";
import type { WorkoutCategory } from "@/types";

// Gym home: cache for 60s, revalidate in background
export const revalidate = 60;

interface Props {
  params: Promise<{ gymSlug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { gymSlug } = await params;
  const tenant = await getTenantBySlug(gymSlug);
  return {
    title: tenant ? `${tenant.name} — Workouts` : "Gym Not Found",
  };
}

export default async function GymLandingPage({ params }: Props) {
  const { gymSlug } = await params;
  const [tenant, user] = await Promise.all([
    getTenantBySlug(gymSlug),
    getAuthUser(),
  ]);

  if (!tenant) notFound();

  const [quickStarts, featured, categories, memberStats] = await Promise.all([
    getQuickStartWorkoutsForTenant(tenant.id),
    getFeaturedWorkoutsForTenant(tenant.id, 3),
    getCategoriesForTenant(tenant.id),
    user ? getMemberStats(user.id, tenant.id) : Promise.resolve(null),
  ]);

  // Category counts from the full published list
  const allWorkouts = await getWorkoutsByTenant(tenant.id);
  const categoryCounts = Object.fromEntries(
    categories.map((cat) => [
      cat,
      allWorkouts.filter((w) => w.category === cat).length,
    ])
  ) as Record<WorkoutCategory, number>;

  return (
    <main className="flex-1 w-full mx-auto max-w-2xl px-5 pb-24">
      {/* ── Top nav ───────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          {tenant.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.logoUrl} alt={tenant.name} className="h-7 w-auto object-contain" />
          ) : (
            <span className="text-base font-bold text-foreground tracking-tight">{tenant.name}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/g/${gymSlug}/history`}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            History
          </Link>
          {user ? (
            <Link
              href={`/g/${gymSlug}/me`}
              className="rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
            >
              My Profile
            </Link>
          ) : (
            <Link
              href={`/login?next=/g/${gymSlug}`}
              className="rounded-full border border-border px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="mb-10 mt-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight text-foreground">
          Ready to train?
        </h1>
        <p className="mt-3 text-[15px] sm:text-base text-muted-foreground leading-relaxed">
          {tenant.welcomeMessage ?? "Pick a workout and start. No account needed."}
        </p>

        {/* Personalised motivational badge */}
        {memberStats && memberStats.currentStreak > 0 ? (
          <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/10 px-3.5 py-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
              {memberStats.currentStreak >= 7
                ? `🔥 ${memberStats.currentStreak}-day streak! You're unstoppable!`
                : memberStats.currentStreak >= 3
                ? `${memberStats.currentStreak} day streak — you're on a roll!`
                : `${memberStats.currentStreak} day streak — keep it up!`}
            </span>
          </div>
        ) : memberStats && memberStats.totalSessions > 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Welcome back{" "}
            <span className="font-semibold text-foreground">
              — {memberStats.totalSessions} workout{memberStats.totalSessions !== 1 ? "s" : ""} completed
            </span>
            . Ready for one more?
          </p>
        ) : null}

        {/* Dominant CTA */}
        <Link
          href={`/g/${gymSlug}/workouts`}
          className="mt-6 flex h-[3.25rem] w-full items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-bold text-primary-foreground shadow-sm transition-all duration-[120ms] hover:opacity-90 active:scale-[0.98] sm:w-auto sm:px-8"
        >
          Browse All Workouts
          <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.5} />
        </Link>
      </section>

      {/* ── Quick Start ────────────────────────────────────────────────── */}
      {quickStarts.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Start Right Now
          </h2>
          <div className="flex flex-col gap-3">
            {quickStarts.map((workout) => (
              <Link
                key={workout.id}
                href={`/g/${gymSlug}/workouts/${workout.id}`}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm transition-all duration-[150ms] hover:border-border/80 hover:shadow-md active:scale-[0.98]"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-12 w-12 flex-shrink-0 rounded-xl p-2.5 flex flex-col items-center justify-center text-primary bg-primary/10">
                    {(() => {
                      const Icon = getCategoryIcon(workout.category);
                      return <Icon className="h-full w-full" strokeWidth={2.5} />;
                    })()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold text-foreground truncate">
                      {workout.title}
                    </p>
                    <p className="mt-1 text-xs font-medium text-muted-foreground">
                      {workout.category} <span className="opacity-50 mx-1">•</span> {DIFFICULTY_STYLES[workout.difficulty].label}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-[13px] font-medium text-muted-foreground self-start sm:self-auto pl-16 sm:pl-0">
                  <span className="px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground">{formatDuration(workout.estimatedMinutes)}</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── By category ────────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Categories
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/g/${gymSlug}/workouts?category=${encodeURIComponent(cat)}`}
                className="group flex flex-col items-start gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-border/80 hover:shadow-md active:scale-[0.98]"
              >
                <div className="flex w-full items-start justify-between">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {(() => {
                      const Icon = getCategoryIcon(cat);
                      return <Icon className="h-5 w-5" strokeWidth={2.5} />;
                    })()}
                  </div>
                  <ChevronRight className="h-4 w-4 mt-1 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground/80" />
                </div>
                <div>
                  <span className="block text-sm font-bold text-foreground">{cat}</span>
                  <span className="mt-1 block text-[11px] font-semibold text-muted-foreground">
                    {categoryCounts[cat]} WORKOUT{categoryCounts[cat] !== 1 ? "S" : ""}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Featured ───────────────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Featured Programs
          </h2>
          <div className="flex flex-col gap-3">
            {featured.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                gymSlug={gymSlug}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
