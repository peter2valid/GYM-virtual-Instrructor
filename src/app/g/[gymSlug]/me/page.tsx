import { redirect } from "next/navigation";
import Link from "next/link";
import { Flame, ChevronRight, History, TrendingUp, Settings, Trophy, Zap, ArrowLeft } from "lucide-react";
import { getAuthUser } from "@/features/auth/actions";
import { getTenantBySlug } from "@/features/tenants/queries";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { getMemberStats } from "@/features/sessions/queries";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils/cn";

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

  const memberStats = await getMemberStats(user.id, tenant.id);

  const displayName = profile?.full_name ?? user.email?.split("@")[0] ?? "Member";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <main className="flex-1 w-full mx-auto max-w-2xl bg-background pb-32">
      {/* ── Top Header ────────────────────────────────────────────── */}
      <header className="px-5 pt-8 pb-4 flex items-center justify-between">
        <Link
          href={`/g/${gymSlug}`}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-card shadow-badge ring-1 ring-border/5 transition-all active:scale-90"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Link
          href={`/g/${gymSlug}/me/edit`}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-card shadow-badge ring-1 ring-border/5 transition-all active:scale-90"
        >
          <Settings className="h-5 w-5 text-muted-foreground" />
        </Link>
      </header>

      {/* ── Avatar & Identity ─────────────────────────────────────── */}
      <section className="flex flex-col items-center px-5 mb-10">
        <div className="relative group mb-6">
          <div className="absolute -inset-4 rounded-full bg-primary/20 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="relative h-32 w-32 rounded-[3rem] object-cover shadow-2xl ring-4 ring-background"
            />
          ) : (
            <div className="relative flex h-32 w-32 items-center justify-center rounded-[3rem] bg-zinc-900 text-4xl font-black text-white shadow-2xl ring-4 ring-background">
              {initials}
            </div>
          )}
          {memberStats.currentStreak > 0 && (
            <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 shadow-lg ring-4 ring-background">
              <Flame className="h-5 w-5 text-white fill-current" />
            </div>
          )}
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-foreground">{displayName}</h1>
          <p className="text-sm font-medium text-muted-foreground/60">{user.email}</p>
        </div>
      </section>

      {/* ── Achievements Bar ──────────────────────────────────────── */}
      <section className="px-5 mb-12">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-[2.5rem] bg-primary/5 p-6 text-center ring-1 ring-primary/10">
            <Trophy className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-black text-primary leading-none">{memberStats.totalSessions}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary/40">Workouts</p>
          </div>
          <div className="rounded-[2.5rem] bg-orange-500/5 p-6 text-center ring-1 ring-orange-500/10">
            <Flame className="h-6 w-6 text-orange-500 mx-auto mb-2 fill-current" />
            <p className="text-2xl font-black text-orange-600 leading-none">{memberStats.currentStreak}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-orange-600/40">Day Streak</p>
          </div>
        </div>
      </section>

      {/* ── Activity Links ────────────────────────────────────────── */}
      <section className="px-5 space-y-6">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/40 px-2">
          Your Activity
        </h2>
        <div className="space-y-3">
          <ActivityLink
            href={`/g/${gymSlug}/history`}
            title="Workout History"
            desc="See all your past sessions"
            icon={History}
            color="text-blue-500"
            bg="bg-blue-500/10"
          />
          <ActivityLink
            href={`/g/${gymSlug}/progress`}
            title="Insights & Stats"
            desc="Deep dive into your progress"
            icon={TrendingUp}
            color="text-green-500"
            bg="bg-green-500/10"
          />
        </div>
      </section>

      {/* ── Reward Teaser ─────────────────────────────────────────── */}
      <section className="mt-12 px-5">
        <div className="rounded-[2.5rem] bg-zinc-900 p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
              <Zap className="h-5 w-5 text-primary fill-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black tracking-tight">Level Up Your Training</h3>
              <p className="text-sm text-white/40 leading-relaxed">
                Complete 5 more workouts this month to unlock the "Consistent" badge.
              </p>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy className="h-32 w-32 rotate-12" />
          </div>
        </div>
      </section>
    </main>
  );
}

function ActivityLink({ href, title, desc, icon: Icon, color, bg }: {
  href: string;
  title: string;
  desc: string;
  icon: any;
  color: string;
  bg: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-3xl bg-card p-4 pr-6 shadow-badge ring-1 ring-border/5 transition-all hover:shadow-pill active:scale-[0.98]"
    >
      <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm", bg, color)}>
        <Icon className="h-6 w-6" strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-black text-foreground">{title}</p>
        <p className="text-xs font-medium text-muted-foreground mt-0.5">{desc}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground/20 group-hover:text-foreground/40 transition-all group-hover:translate-x-1" />
    </Link>
  );
}
