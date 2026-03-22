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
import { FadeUp } from "@/components/ui/FadeUp";
import { DIFFICULTY_STYLES, formatDuration } from "@/lib/utils/workout-ui";
import type { WorkoutCategory } from "@/types";

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
    <main className="mx-auto max-w-lg px-4">
      {/* ── Top nav ───────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          {tenant.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.logoUrl} alt={tenant.name} className="h-7 w-auto object-contain" />
          ) : (
            <span className="text-sm font-semibold text-foreground">{tenant.name}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/g/${gymSlug}/history`}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            History
          </Link>
          {user ? (
            <Link
              href={`/g/${gymSlug}/me`}
              className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
            >
              My Profile
            </Link>
          ) : (
            <Link
              href={`/login?next=/g/${gymSlug}`}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────
          No FadeUp here — renders immediately, sets the scene.
      ────────────────────────────────────────────────────────────────── */}
      <section className="relative pb-7 pt-6">
        {/* Subtle radial glow — just enough warmth */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-4 h-52 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(99,102,241,0.06),transparent)]"
        />

        <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-foreground">
          Ready to train?
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          {tenant.welcomeMessage ?? "Pick a workout and start. No account needed."}
        </p>

        {/* Streak badge for logged-in members */}
        {memberStats && memberStats.currentStreak > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/10 px-3 py-1.5">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
              {memberStats.currentStreak} day streak — keep it up!
            </span>
          </div>
        )}

        {/* Dominant CTA */}
        <Link
          href={`/g/${gymSlug}/workouts`}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground transition-all duration-[120ms] hover:opacity-90 active:scale-[0.98] sm:w-auto sm:px-8"
        >
          Browse All Workouts
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* ── Quick Start ──────────────────────────────────────────────────
          Driven by tenant_workout_preferences.is_quick_start in DB.
      ────────────────────────────────────────────────────────────────── */}
      {quickStarts.length > 0 && (
        <FadeUp delay={0} className="pb-9">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Start now
          </p>
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
            {quickStarts.map((workout) => (
              <Link
                key={workout.id}
                href={`/g/${gymSlug}/workouts/${workout.id}`}
                className="group flex items-center justify-between px-4 py-[1.05rem] transition-all duration-[120ms] hover:bg-accent/50 active:scale-[0.99] active:bg-accent/70"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {workout.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {workout.category}&nbsp;·&nbsp;
                    {DIFFICULTY_STYLES[workout.difficulty].label}
                  </p>
                </div>
                <div className="ml-4 flex flex-shrink-0 items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDuration(workout.estimatedMinutes)}</span>
                  <ChevronRight className="h-3.5 w-3.5 transition-transform duration-[120ms] group-hover:translate-x-0.5 group-hover:text-foreground/60" />
                </div>
              </Link>
            ))}
          </div>
        </FadeUp>
      )}

      {/* ── By category ──────────────────────────────────────────────────
          Category list driven by published workouts in DB.
      ────────────────────────────────────────────────────────────────── */}
      <FadeUp delay={0.06} className="pb-9">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          By category
        </p>
        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/g/${gymSlug}/workouts?category=${encodeURIComponent(cat)}`}
              className="group flex items-center justify-between px-4 py-3 transition-all duration-[120ms] hover:bg-accent/50 active:scale-[0.99] active:bg-accent/70"
            >
              <span className="text-sm font-medium text-foreground">{cat}</span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {categoryCounts[cat]}{" "}
                {categoryCounts[cat] === 1 ? "workout" : "workouts"}
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-transform duration-[120ms] group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </FadeUp>

      {/* ── Featured ─────────────────────────────────────────────────────
          Driven by tenant_workout_preferences.is_recommended in DB.
      ────────────────────────────────────────────────────────────────── */}
      {featured.length > 0 && (
        <FadeUp delay={0.1} className="pb-16">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Featured
            </p>
            <Link
              href={`/g/${gymSlug}/workouts`}
              className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
            >
              See all
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {featured.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                gymSlug={gymSlug}
              />
            ))}
          </div>
        </FadeUp>
      )}
    </main>
  );
}
