import { redirect, notFound } from "next/navigation";
import crypto from "crypto";
import Link from "next/link";
import { Flame, ChevronRight, History, TrendingUp, Settings, Trophy, Zap, ArrowLeft, CreditCard } from "lucide-react";
import { getAuthUser } from "@/features/auth/actions";
import { getTenantBySlug, getFeatureFlagsForTenant } from "@/features/tenants/queries";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { getMemberStats } from "@/features/sessions/queries";
import { cn } from "@/lib/utils/cn";
import { MemberQrCode } from "./MemberQrCode";

function buildMemberQrUrl(memberId: string, gymId: string, gymSlug: string): string {
  const secret = process.env.MEMBER_QR_SECRET ?? process.env.NEXTAUTH_SECRET ?? "dev-secret";
  const sig = crypto.createHmac("sha256", secret).update(`${memberId}:${gymId}`).digest("hex");
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return `${base}/g/${gymSlug}/attend?mid=${memberId}&sig=${sig}`;
}

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

  const flags = await getFeatureFlagsForTenant(tenant.id);
  if (!flags.member_dashboard) redirect(`/g/${gymSlug}`);

  if (!user) redirect(`/login?next=/g/${gymSlug}/me`);

  const client = await createServerSupabaseClient();

  const [profileRes, memberRes, memberStatsData] = await Promise.all([
    client.from("profiles").select("full_name, avatar_url").eq("id", user.id).maybeSingle(),
    // V2: look up member row + active membership
    client
      .from("members")
      .select("id, status, member_code, member_memberships(id, status, end_date, membership_types(name))")
      .eq("gym_id", tenant.id)
      .eq("profile_id", user.id)
      .maybeSingle(),
    getMemberStats(user.id, tenant.id),
  ]);

  const profile = profileRes.data;
  const member = memberRes.data;

  // Build personal check-in QR URL (server-signed)
  const memberQrUrl = member
    ? buildMemberQrUrl(member.id, tenant.id, gymSlug)
    : null;

  // Active membership (latest by end_date)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeMembership = (member?.member_memberships as any[])
    ?.filter((m: { status: string }) => m.status === "active")
    .sort((a: { end_date: string }, b: { end_date: string }) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0] ?? null;

  const displayName = profile?.full_name ?? user.email?.split("@")[0] ?? "Member";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const daysLeft = activeMembership
    ? Math.max(0, Math.ceil((new Date(activeMembership.end_date).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <main className="flex-1 w-full mx-auto max-w-2xl bg-background pb-32">
      {/* Header */}
      <header className="px-5 pt-8 pb-4 flex items-center justify-between">
        <Link href={`/g/${gymSlug}`} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-card shadow-badge ring-1 ring-border/5 transition-all active:scale-90">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Link href={`/g/${gymSlug}/me/edit`} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-card shadow-badge ring-1 ring-border/5 transition-all active:scale-90">
          <Settings className="h-5 w-5 text-muted-foreground" />
        </Link>
      </header>

      {/* Avatar & Identity */}
      <section className="flex flex-col items-center px-5 mb-10">
        <div className="relative group mb-6">
          <div className="absolute -inset-4 rounded-full bg-primary/20 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt={displayName} className="relative h-32 w-32 rounded-[3rem] object-cover shadow-2xl ring-4 ring-background" />
          ) : (
            <div className="relative flex h-32 w-32 items-center justify-center rounded-[3rem] bg-zinc-900 text-4xl font-black text-white shadow-2xl ring-4 ring-background">
              {initials}
            </div>
          )}
          {memberStatsData.currentStreak > 0 && (
            <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 shadow-lg ring-4 ring-background">
              <Flame className="h-5 w-5 text-white fill-current" />
            </div>
          )}
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-foreground">{displayName}</h1>
          <p className="text-sm font-medium text-muted-foreground/60">{user.email}</p>
          {member?.member_code && (
            <p className="text-xs font-mono text-muted-foreground/40">#{member.member_code}</p>
          )}
        </div>
      </section>

      {/* Membership card */}
      {activeMembership ? (
        <section className="px-5 mb-8">
          <div className={cn(
            "rounded-[2.5rem] p-6 ring-1 flex items-center gap-4",
            daysLeft !== null && daysLeft <= 7
              ? "bg-orange-500/5 ring-orange-500/20"
              : "bg-primary/5 ring-primary/10"
          )}>
            <div className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
              daysLeft !== null && daysLeft <= 7 ? "bg-orange-500/10 text-orange-500" : "bg-primary/10 text-primary"
            )}>
              <CreditCard className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-foreground">{activeMembership.membership_types?.name ?? "Active Membership"}</p>
              <p className={cn("text-xs font-medium mt-0.5", daysLeft !== null && daysLeft <= 7 ? "text-orange-500" : "text-muted-foreground")}>
                {daysLeft !== null
                  ? daysLeft === 0
                    ? "Expires today"
                    : daysLeft === 1
                    ? "1 day left"
                    : `${daysLeft} days left`
                  : `Expires ${new Date(activeMembership.end_date).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}`}
              </p>
            </div>
          </div>
        </section>
      ) : member ? (
        <section className="px-5 mb-8">
          <div className="rounded-[2.5rem] bg-muted/30 p-6 ring-1 ring-border/10 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground/40">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-black text-foreground">No Active Membership</p>
              <p className="text-xs text-muted-foreground mt-0.5">Contact your gym to renew.</p>
            </div>
          </div>
        </section>
      ) : null}

      {/* Stats */}
      <section className="px-5 mb-12">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-[2.5rem] bg-primary/5 p-5 text-center ring-1 ring-primary/10">
            <Trophy className="h-5 w-5 text-primary mx-auto mb-1.5" />
            <p className="text-xl font-black text-primary leading-none">{memberStatsData.totalSessions}</p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-primary/40">Workouts</p>
          </div>
          <div className="rounded-[2.5rem] bg-orange-500/5 p-5 text-center ring-1 ring-orange-500/10">
            <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1.5 fill-current" />
            <p className="text-xl font-black text-orange-600 leading-none">{memberStatsData.currentStreak}</p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-orange-600/40">Streak</p>
          </div>
          <div className="rounded-[2.5rem] bg-green-500/5 p-5 text-center ring-1 ring-green-500/10">
            <Zap className="h-5 w-5 text-green-500 mx-auto mb-1.5 fill-current" />
            <p className="text-xl font-black text-green-600 leading-none">{memberStatsData.totalMinutes}</p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-green-600/40">Minutes</p>
          </div>
        </div>
      </section>

      {/* Activity links */}
      <section className="px-5 space-y-6">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/40 px-2">Your Activity</h2>
        <div className="space-y-3">
          {memberQrUrl && (
            <MemberQrCode qrUrl={memberQrUrl} memberName={displayName} gymName={tenant.name} />
          )}
          <ActivityLink href={`/g/${gymSlug}/history`} title="Workout History" desc="See all your past sessions" icon={History} color="text-blue-500" bg="bg-blue-500/10" />
          <ActivityLink href={`/g/${gymSlug}/progress`} title="Insights & Stats" desc="Deep dive into your progress" icon={TrendingUp} color="text-green-500" bg="bg-green-500/10" />
        </div>
      </section>

      {/* Reward teaser */}
      <section className="mt-12 px-5">
        <div className="rounded-[2.5rem] bg-zinc-900 p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
              <Zap className="h-5 w-5 text-primary fill-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black tracking-tight">Level Up Your Training</h3>
              <p className="text-sm text-white/40 leading-relaxed">Complete 5 more workouts this month to unlock the &quot;Consistent&quot; badge.</p>
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
  href: string; title: string; desc: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any; color: string; bg: string;
}) {
  return (
    <Link href={href} className="group flex items-center gap-4 rounded-3xl bg-card p-4 pr-6 shadow-badge ring-1 ring-border/5 transition-all hover:shadow-pill active:scale-[0.98]">
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
