import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Flame, Trophy, Zap, TrendingUp, Calendar } from "lucide-react";
import { getTenantBySlug } from "@/features/tenants/queries";
import { getAuthUser } from "@/features/auth/actions";
import { getMemberStats, getMemberHeatmapData, getGymLeaderboard } from "@/features/sessions/queries";
import { WeeklyActivityChart } from "@/components/charts/WeeklyActivityChart";
import { MemberHeatmap } from "@/components/member/MemberHeatmap";
import { StreakLeaderboard } from "@/components/member/StreakLeaderboard";
import { cn } from "@/lib/utils/cn";

interface Props {
  params: Promise<{ gymSlug: string }>;
}

export const metadata = { title: "Your Progress" };

export default async function ProgressPage({ params }: Props) {
  const { gymSlug } = await params;

  const [tenant, user] = await Promise.all([
    getTenantBySlug(gymSlug),
    getAuthUser(),
  ]);

  if (!tenant) notFound();

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <div className="max-w-xs space-y-6">
          <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-[2rem] bg-muted/50 text-muted-foreground/30">
             <Calendar className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-foreground">Track Your Journey</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sign in to see your workout streaks, activity charts, and gym leaderboard.
            </p>
          </div>
          <Link
            href={`/login?next=/g/${gymSlug}/progress`}
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-primary px-8 text-[15px] font-black text-primary-foreground shadow-pill shadow-primary/20"
          >
            Sign in to start
          </Link>
        </div>
      </div>
    );
  }

  const [stats, heatmapDates, leaderboard] = await Promise.all([
    getMemberStats(user.id, tenant.id),
    getMemberHeatmapData(user.id, tenant.id),
    getGymLeaderboard(tenant.id),
  ]);

  const trainedDays = stats.weeklyData.filter(d => d.count > 0).length;

  return (
    <div className="flex min-h-screen flex-col bg-background pb-32">
      {/* ── Premium Header ────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl px-4 py-6">
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <Link
            href={`/g/${gymSlug}`}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-card shadow-badge ring-1 ring-border/5 transition-all active:scale-90"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Your Progress</span>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl px-5 space-y-12">
        {/* ── Emotional Headline ─────────────────────────────────────── */}
        <section className="space-y-2 pt-4">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-foreground leading-[1.1]">
            {trainedDays > 0 
              ? `You trained ${trainedDays} day${trainedDays !== 1 ? 's' : ''} this week 💪`
              : "Let's kick things off! 🚀"}
          </h1>
          <p className="text-base font-medium text-muted-foreground/60">
            {stats.currentStreak > 0 
              ? `You're on a ${stats.currentStreak}-day heater. Keep that momentum!`
              : "Consistency is the key to real results."}
          </p>
        </section>

        {/* ── Highlight Stats Row ───────────────────────────────────── */}
        <section className="grid grid-cols-2 gap-4">
          <div className="group rounded-[2.5rem] bg-orange-500/10 p-6 shadow-sm transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-600/60">Streak</span>
              <Flame className="h-5 w-5 text-orange-500 fill-current group-hover:animate-bounce" />
            </div>
            <p className="text-4xl font-black text-orange-600 leading-none">
              {stats.currentStreak}<span className="text-lg ml-1 opacity-60">DAYS</span>
            </p>
          </div>
          
          <div className="group rounded-[2.5rem] bg-primary/5 p-6 shadow-sm transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Total</span>
              <Trophy className="h-5 w-5 text-primary group-hover:rotate-12 transition-transform" />
            </div>
            <p className="text-4xl font-black text-primary leading-none">
              {stats.totalSessions}<span className="text-lg ml-1 opacity-60">SESSIONS</span>
            </p>
          </div>
        </section>

        {/* ── Weekly Activity Chart ─────────────────────────────────── */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/40">Activity History</h2>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
              <TrendingUp className="h-3 w-3" />
              +15% v. LAST WEEK
            </div>
          </div>
          
          <div className="rounded-[2.5rem] bg-card p-8 shadow-badge ring-1 ring-border/5">
            {stats.totalSessions > 0 ? (
              <WeeklyActivityChart data={stats.weeklyData} />
            ) : (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                <div className="h-1 w-24 rounded-full bg-muted/40" />
                <p className="text-sm font-bold text-muted-foreground/30 uppercase tracking-widest">No Data Yet</p>
              </div>
            )}
            <div className="mt-8 border-t border-border/40 pt-6">
              <p className="text-center text-[13px] font-medium text-muted-foreground italic">
                You usually train hardest on <span className="font-black text-foreground">Wednesdays</span>.
              </p>
            </div>
          </div>
        </section>

        {/* ── Heatmap & Community ───────────────────────────────────── */}
        <section className="space-y-12">
           <MemberHeatmap dates={heatmapDates} />
           <StreakLeaderboard entries={leaderboard} currentMemberId={user.id} />
        </section>
      </div>

      {/* ── Sticky Start Button ─────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-6 pt-4 pb-8 bg-gradient-to-t from-background via-background/90 to-transparent">
        <div className="mx-auto max-w-lg">
          <Link
            href={`/g/${gymSlug}/workouts`}
            className="flex h-16 w-full items-center justify-center gap-3 rounded-[1.25rem] bg-zinc-900 text-[15px] font-black tracking-wide text-white shadow-pill shadow-black/10 transition-all active:scale-[0.98] hover:bg-black"
          >
            START A WORKOUT
            <Zap className="h-5 w-5 fill-primary text-primary" />
          </Link>
        </div>
      </div>
    </div>
  );
}
