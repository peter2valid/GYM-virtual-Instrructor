import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Flame, Dumbbell, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { getTenantBySlug, getFeatureFlagsForTenant } from "@/features/tenants/queries";
import { getAuthUser } from "@/features/auth/actions";
import {
  getFeaturedWorkoutsForTenant,
  getCategoriesForTenant,
  getWorkoutsByTenant,
} from "@/features/workouts/queries";
import { getMemberStats } from "@/features/sessions/queries";
import { WorkoutCard } from "@/components/workout/WorkoutCard";
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

  const [featured, categories, memberStats, flags] = await Promise.all([
    getFeaturedWorkoutsForTenant(tenant.id, 3),
    getCategoriesForTenant(tenant.id),
    user ? getMemberStats(user.id, tenant.id) : Promise.resolve(null),
    getFeatureFlagsForTenant(tenant.id),
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
          {flags.workout_history && (
            <Link
              href={`/g/${gymSlug}/history`}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              History
            </Link>
          )}
          {flags.member_login && (
            user ? (
              flags.member_dashboard ? (
                <Link
                  href={`/g/${gymSlug}/me`}
                  className="rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity shadow-sm"
                >
                  My Profile
                </Link>
              ) : null
            ) : (
              <Link
                href={`/login?next=/g/${gymSlug}`}
                className="rounded-full bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.12)] transition-shadow"
              >
                Sign In
              </Link>
            )
          )}
        </div>
      </nav>

      {/* ── Hero Banner ─────────────────────────────────────────────────── */}
      <section className="relative mb-10 mt-4 overflow-hidden rounded-[2.5rem] bg-zinc-900 p-8 text-white shadow-2xl">
        <div className="relative z-10 max-w-[240px]">
          <span className="mb-3 inline-block rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary-foreground">
            Featured Program
          </span>
          <h1 className="text-3xl font-black leading-tight tracking-tight">
            6 Week Fat Loss Challenge
          </h1>
          <p className="mt-2 text-sm text-white/60 leading-relaxed italic">
            Transform your body with our most popular home plan.
          </p>
          <Link
            href={`/g/${gymSlug}/workouts`}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-white px-6 text-sm font-bold text-black shadow-lg transition-transform active:scale-95"
          >
            Start Now
          </Link>
        </div>
        
        {/* Abstract shapes for "premium" feel */}
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-16 right-0 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
        
        {/* Placeholder for "Athletic" feel */}
        <Dumbbell className="absolute -right-4 bottom-8 h-40 w-40 -rotate-12 text-white/5" strokeWidth={1} />
      </section>

      {/* ── Quick Search / Browse Entry Point ──────────────────────────── */}
      <section className="mb-10">
        <Link
          href={`/g/${gymSlug}/workouts`}
          className="flex items-center gap-3 w-full rounded-[1.25rem] bg-card px-5 h-14 shadow-badge ring-1 ring-border/20 transition-all hover:ring-primary/30 hover:shadow-pill active:scale-[0.98]"
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground/40" />
          <span className="flex-1 text-[14px] text-muted-foreground/50 font-medium">
            Search exercises, muscles, goals…
          </span>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
            Browse
          </span>
        </Link>
      </section>

      {/* ── Continue Workout (if exists) ────────────────────────────────── */}
      {memberStats && memberStats.totalSessions > 0 && (
        <section className="mb-10 animate-in fade-in slide-in-from-bottom-4">
          <h2 className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/50">
            Continue Training
          </h2>
          <div className="group relative overflow-hidden rounded-[2rem] bg-card p-6 shadow-pill ring-1 ring-border/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
                  <Flame className="h-6 w-6 fill-current" />
                </div>
                <div>
                  <p className="text-sm font-black text-foreground">Upper Body Blast</p>
                  <p className="text-xs font-semibold text-muted-foreground">Day 2 · 15 mins remaining</p>
                </div>
              </div>
              <Link
                href={`/g/${gymSlug}/workouts`}
                className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-all active:scale-95"
              >
                Resume
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── By category (Modern Tiles) ─────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/50">
              Categories
            </h2>
            <Link href={`/g/${gymSlug}/workouts`} className="text-[11px] font-bold text-primary uppercase tracking-wider">
              See All
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {categories.slice(0, 4).map((cat) => {
              const colors = getCategoryColors(cat);
              const Icon = getCategoryIcon(cat);
              return (
                <Link
                  key={cat}
                  href={`/g/${gymSlug}/workouts?category=${encodeURIComponent(cat)}`}
                  className={cn(
                    "tap-bounce group flex flex-col items-center justify-center gap-3 rounded-[2rem] p-5 ring-1 transition-all hover:shadow-pill hover:-translate-y-0.5",
                    colors.cardBg,
                    colors.cardRing
                  )}
                >
                  <div className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm transition-transform group-hover:scale-110",
                    colors.bg,
                    colors.text
                  )}>
                    <Icon className="h-6 w-6" strokeWidth={2.5} />
                  </div>
                  <div className="text-center">
                    <span className="block text-[13px] font-black tracking-tight text-foreground">{cat}</span>
                    <span className="mt-0.5 block text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">
                      {categoryCounts[cat]} workouts
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Progress Teaser ────────────────────────────────────────────── */}
      {memberStats && flags.workout_history && (
        <section className="mb-10">
          <Link
            href={`/g/${gymSlug}/progress`}
            className="tap-bounce group relative block overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-orange-500/10 to-primary/5 p-7 ring-1 ring-orange-500/20 transition-all hover:shadow-pill hover:-translate-y-0.5"
          >
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-1.5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500/60">Your Momentum</p>
                <div className="flex items-baseline gap-2.5">
                  <Flame className="h-6 w-6 text-orange-500 fill-current shrink-0 self-center" />
                  <h3 className="text-3xl font-black text-foreground leading-none">
                    {memberStats.totalSessions}
                    <span className="ml-2 text-base font-bold text-muted-foreground/50">sessions</span>
                  </h3>
                </div>
                <p className="text-sm font-medium text-muted-foreground/70 leading-relaxed">
                  You trained <span className="font-black text-orange-500">4 days</span> this week. Keep it up!
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-card shadow-sm ring-1 ring-border transition-transform group-hover:scale-110 group-hover:translate-x-0.5">
                <ArrowRight className="h-5 w-5 text-orange-500" />
              </div>
            </div>
            <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-orange-500/15 blur-3xl" />
          </Link>
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
function getCategoryColors(cat: string) {
  const map: Record<string, { bg: string; text: string; cardBg: string; cardRing: string }> = {
    Abs:      { bg: "bg-blue-500/15",   text: "text-blue-600",   cardBg: "bg-blue-500/10",   cardRing: "ring-blue-500/20" },
    Cardio:   { bg: "bg-green-500/15",  text: "text-green-600",  cardBg: "bg-green-500/10",  cardRing: "ring-green-500/20" },
    Strength: { bg: "bg-purple-500/15", text: "text-purple-600", cardBg: "bg-purple-500/10", cardRing: "ring-purple-500/20" },
    Warmup:   { bg: "bg-orange-500/15", text: "text-orange-600", cardBg: "bg-orange-500/10", cardRing: "ring-orange-500/20" },
    Legs:     { bg: "bg-rose-500/15",   text: "text-rose-600",   cardBg: "bg-rose-500/10",   cardRing: "ring-rose-500/20" },
    Back:     { bg: "bg-indigo-500/15", text: "text-indigo-600", cardBg: "bg-indigo-500/10", cardRing: "ring-indigo-500/20" },
    Chest:    { bg: "bg-sky-500/15",    text: "text-sky-600",    cardBg: "bg-sky-500/10",    cardRing: "ring-sky-500/20" },
  };
  return map[cat] || { bg: "bg-zinc-500/15", text: "text-zinc-600", cardBg: "bg-zinc-500/10", cardRing: "ring-zinc-500/20" };
}
