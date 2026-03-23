import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ChevronRight, Flame, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils/cn";
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
              className="rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity shadow-sm"
            >
              My Profile
            </Link>
          ) : (
            <Link
              href={`/login?next=/g/${gymSlug}`}
              className="rounded-full bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.12)] transition-shadow"
            >
              Sign In
            </Link>
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
          <div className="grid grid-cols-2 gap-4">
            {categories.slice(0, 4).map((cat) => {
              const colors = getCategoryColors(cat);
              return (
                <Link
                  key={cat}
                  href={`/g/${gymSlug}/workouts?category=${encodeURIComponent(cat)}`}
                  className="group flex flex-col items-center justify-center gap-3 rounded-[2.25rem] bg-card p-6 shadow-badge transition-all hover:shadow-pill active:scale-[0.96]"
                >
                  <div className={cn(
                    "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm transition-transform group-hover:scale-110",
                    colors.bg,
                    colors.text
                  )}>
                    {(() => {
                      const Icon = getCategoryIcon(cat);
                      return <Icon className="h-7 w-7" strokeWidth={2.5} />;
                    })()}
                  </div>
                  <div className="text-center">
                    <span className="block text-sm font-black tracking-tight text-foreground">{cat}</span>
                    <span className="mt-0.5 block text-[10px] font-bold text-muted-foreground/40 uppercase">
                      {categoryCounts[cat]} Workouts
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Progress Teaser ────────────────────────────────────────────── */}
      {memberStats && (
        <section className="mb-10 rounded-[2.5rem] bg-primary/5 p-6 ring-1 ring-primary/10">
          <div className="flex items-center gap-4">
            <div className="flex flex-1 flex-col gap-1">
              <p className="text-xs font-black uppercase tracking-widest text-primary/60">Your Progress</p>
              <h3 className="text-xl font-black text-foreground">
                You trained {memberStats.totalSessions} days this week 💪
              </h3>
            </div>
            <Link
              href={`/g/${gymSlug}/progress`}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm transition-transform active:scale-90"
            >
              <ArrowRight className="h-5 w-5 text-primary" />
            </Link>
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
function getCategoryColors(cat: string) {
  const map: Record<string, { bg: string; text: string }> = {
    Abs: { bg: "bg-blue-500/10", text: "text-blue-600" },
    Cardio: { bg: "bg-green-500/10", text: "text-green-600" },
    Strength: { bg: "bg-purple-500/10", text: "text-purple-600" },
    Warmup: { bg: "bg-orange-500/10", text: "text-orange-600" },
    Legs: { bg: "bg-rose-500/10", text: "text-rose-600" },
    Back: { bg: "bg-indigo-500/10", text: "text-indigo-600" },
    Chest: { bg: "bg-sky-500/10", text: "text-sky-600" },
  };
  return map[cat] || { bg: "bg-zinc-500/10", text: "text-zinc-600" };
}
