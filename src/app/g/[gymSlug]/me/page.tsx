import { redirect } from "next/navigation";
import Link from "next/link";
import { Flame, ChevronRight, History, TrendingUp, LogOut } from "lucide-react";
import { getAuthUser } from "@/features/auth/actions";
import { getTenantBySlug } from "@/features/tenants/queries";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { getMemberStats } from "@/features/sessions/queries";
import { notFound } from "next/navigation";
import { ProfileForm } from "./ProfileForm";
import { SignOutButton } from "./SignOutButton";

interface Props {
  params: Promise<{ gymSlug: string }>;
}

export const metadata = { title: "My Profile" };

export default async function MemberProfilePage({ params }: Props) {
  const { gymSlug } = await params;

  const [user, tenant] = await Promise.all([
    getAuthUser(),
    getTenantBySlug(gymSlug),
  ]);

  if (!tenant) notFound();
  if (!user) redirect(`/login?next=/g/${gymSlug}/me`);

  const client = await createServerSupabaseClient();
  const { data: profile } = await client
    .from("profiles")
    .select("full_name, avatar_url, role, created_at")
    .eq("id", user.id)
    .maybeSingle();

  const { count: sessionCount } = await client
    .from("workout_sessions")
    .select("*", { count: "exact", head: true })
    .eq("member_id", user.id)
    .eq("tenant_id", tenant.id)
    .eq("status", "completed");

  const { count: attendanceCount } = await client
    .from("attendance_logs")
    .select("*", { count: "exact", head: true })
    .eq("member_id", user.id)
    .eq("tenant_id", tenant.id);

  const memberStats = await getMemberStats(user.id, tenant.id);

  const displayName = profile?.full_name ?? user.email?.split("@")[0] ?? "Member";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  return (
    <main className="flex-1 w-full mx-auto max-w-2xl px-5 pb-28">
      {/* ── Top nav ─────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between py-6">
        <Link
          href={`/g/${gymSlug}`}
          className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          ← {tenant.name}
        </Link>
        <span className="text-base font-bold text-foreground tracking-tight">Profile</span>
        <div className="w-[72px]" />
      </nav>

      {/* ── Avatar + identity ──────────────────────────────────────── */}
      <section className="flex flex-col items-center gap-3 mb-8">
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={displayName}
            className="h-24 w-24 rounded-full object-cover shadow-[0_0_0_4px_hsl(var(--background)),0_0_0_6px_hsl(var(--primary)/0.3)]"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-3xl font-extrabold text-primary-foreground shadow-[0_0_0_4px_hsl(var(--background)),0_0_0_6px_hsl(var(--primary)/0.25),0_4px_16px_rgba(0,0,0,0.12)]">
            {initials}
          </div>
        )}
        <div className="text-center">
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">{displayName}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{user.email}</p>
          {memberSince && (
            <p className="mt-1 text-xs text-muted-foreground/60">Member since {memberSince}</p>
          )}
        </div>

        {/* Streak badge */}
        {memberStats.currentStreak > 0 && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-4 py-2">
            <Flame className="h-4 w-4 text-orange-500" fill="currentColor" />
            <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
              {memberStats.currentStreak}-day streak
            </span>
          </div>
        )}
      </section>

      {/* ── Stats — shadow cards, no borders ────────────────────────── */}
      <section className="mb-8">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Your Stats
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-card px-3 py-5 text-center shadow-[0_1px_4px_rgba(0,0,0,0.07)]">
            <p className="text-2xl font-extrabold text-foreground">{sessionCount ?? 0}</p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">Workouts</p>
          </div>
          <div className="rounded-2xl bg-card px-3 py-5 text-center shadow-[0_1px_4px_rgba(0,0,0,0.07)]">
            <p className="text-2xl font-extrabold text-foreground">{attendanceCount ?? 0}</p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">Check-Ins</p>
          </div>
          <div className="rounded-2xl bg-card px-3 py-5 text-center shadow-[0_1px_4px_rgba(0,0,0,0.07)]">
            <div className="flex items-center justify-center gap-1">
              {memberStats.currentStreak > 0 && (
                <Flame className="h-5 w-5 text-orange-500" fill="currentColor" />
              )}
              <p className="text-2xl font-extrabold text-foreground">
                {memberStats.currentStreak}
              </p>
            </div>
            <p className="mt-1 text-xs font-medium text-muted-foreground">Day Streak</p>
          </div>
        </div>
      </section>

      {/* ── Quick links ─────────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Activity
        </h2>
        <div className="flex flex-col gap-2.5">
          <Link
            href={`/g/${gymSlug}/history`}
            className="group flex items-center gap-4 rounded-2xl bg-card px-5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.07)] transition-all hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <History className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold text-foreground">Workout History</p>
              <p className="text-xs text-muted-foreground mt-0.5">All your completed sessions</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground/80" />
          </Link>

          <Link
            href={`/g/${gymSlug}/progress`}
            className="group flex items-center gap-4 rounded-2xl bg-card px-5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.07)] transition-all hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <TrendingUp className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold text-foreground">Progress</p>
              <p className="text-xs text-muted-foreground mt-0.5">Track your improvements over time</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground/80" />
          </Link>
        </div>
      </section>

      {/* ── Edit profile ────────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Account
        </h2>
        <div className="rounded-2xl bg-card shadow-[0_1px_4px_rgba(0,0,0,0.07)] overflow-hidden">
          <div className="px-5 pt-5 pb-4">
            <p className="text-sm font-bold text-foreground mb-4">Edit Profile</p>
            <ProfileForm
              initialData={{
                fullName: profile?.full_name ?? "",
                avatarUrl: profile?.avatar_url ?? "",
              }}
              gymSlug={gymSlug}
            />
          </div>
        </div>
      </section>

      {/* ── Sign out ────────────────────────────────────────────────── */}
      <section>
        <div className="rounded-2xl bg-card shadow-[0_1px_4px_rgba(0,0,0,0.07)]">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <LogOut className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold text-foreground">Sign Out</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {user.email}
                </p>
              </div>
            </div>
            <SignOutButton gymSlug={gymSlug} />
          </div>
        </div>
      </section>
    </main>
  );
}
