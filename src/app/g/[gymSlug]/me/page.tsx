import { redirect } from "next/navigation";
import Link from "next/link";
import { Flame } from "lucide-react";
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

  // Stats
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

  const initials = (profile?.full_name ?? user.email ?? "?")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <main className="mx-auto max-w-2xl px-4 pb-24">
      {/* Header */}
      <nav className="flex items-center justify-between py-4">
        <Link
          href={`/g/${gymSlug}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {tenant.name}
        </Link>
        <SignOutButton gymSlug={gymSlug} />
      </nav>

      {/* Avatar + name */}
      <div className="mt-6 flex flex-col items-center gap-3">
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={profile.full_name ?? ""}
            className="h-20 w-20 rounded-full object-cover ring-2 ring-border"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
            {initials}
          </div>
        )}
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">
            {profile?.full_name ?? "Member"}
          </p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{sessionCount ?? 0}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Workouts</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{attendanceCount ?? 0}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Check-Ins</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="flex items-center justify-center gap-1">
            {memberStats.currentStreak > 0 && (
              <Flame className="h-5 w-5 text-orange-500" />
            )}
            <p className="text-2xl font-bold text-foreground">{memberStats.currentStreak}</p>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">Day Streak</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link
          href={`/g/${gymSlug}/history`}
          className="rounded-xl border border-border bg-card px-4 py-3 text-center text-sm font-medium text-foreground hover:bg-accent"
        >
          Workout History
        </Link>
        <Link
          href={`/g/${gymSlug}/progress`}
          className="rounded-xl border border-border bg-card px-4 py-3 text-center text-sm font-medium text-foreground hover:bg-accent"
        >
          Progress
        </Link>
      </div>

      {/* Edit form */}
      <div className="mt-6">
        <ProfileForm
          initialData={{
            fullName: profile?.full_name ?? "",
            avatarUrl: profile?.avatar_url ?? "",
          }}
          gymSlug={gymSlug}
        />
      </div>
    </main>
  );
}
