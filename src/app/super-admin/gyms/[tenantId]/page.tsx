import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Activity, CheckSquare, Calendar } from "lucide-react";
import { getAuthUser } from "@/features/auth/actions";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { PlanEditor } from "../../subscriptions/PlanEditor";

interface Props {
  params: Promise<{ tenantId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { tenantId } = await params;
  const client = await createServerSupabaseClient();
  const { data } = await client.from("tenants").select("name").eq("id", tenantId).maybeSingle();
  return { title: data?.name ?? "Gym Details" };
}

export default async function SuperAdminGymDetailPage({ params }: Props) {
  const { tenantId } = await params;

  const user = await getAuthUser();
  if (!user) redirect("/login?next=/super-admin/gyms");

  const client = await createServerSupabaseClient();
  const { data: profile } = await client.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "super_admin") redirect("/");

  // Fetch tenant
  const { data: tenant } = await client
    .from("tenants")
    .select("id, name, slug, subscription_plan, subscription_status, is_active, created_at, logo_url, primary_color")
    .eq("id", tenantId)
    .maybeSingle();

  if (!tenant) notFound();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    { count: totalMembers },
    { count: activeMembers },
    { count: totalSessions },
    { count: recentSessions },
    { count: totalCheckins },
    { data: recentMembers },
    { data: recentActivity },
  ] = await Promise.all([
    client.from("members").select("*", { count: "exact", head: true }).eq("gym_id", tenantId),
    client.from("members").select("*", { count: "exact", head: true }).eq("gym_id", tenantId).eq("status", "active"),
    client.from("workout_sessions").select("*", { count: "exact", head: true }).eq("gym_id", tenantId).eq("status", "completed"),
    client.from("workout_sessions").select("*", { count: "exact", head: true }).eq("gym_id", tenantId).eq("status", "completed").gte("completed_at", thirtyDaysAgo),
    client.from("attendance_checkins").select("*", { count: "exact", head: true }).eq("gym_id", tenantId),
    client.from("members").select("id, first_name, last_name, email, status, joined_at").eq("gym_id", tenantId).order("joined_at", { ascending: false }).limit(8),
    client.from("attendance_checkins").select("id, checkin_at, checkin_method, members(first_name, last_name)").eq("gym_id", tenantId).order("checkin_at", { ascending: false }).limit(10),
  ]);

  const STATUS_STYLES: Record<string, string> = {
    active:    "bg-green-500/10 text-green-600 dark:text-green-400",
    trialing:  "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    past_due:  "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    cancelled: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/super-admin/gyms"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border hover:bg-accent transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{tenant.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <a
                href={`/g/${tenant.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                /g/{tenant.slug}
              </a>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-xs text-muted-foreground">
                Joined {new Date(tenant.created_at).toLocaleDateString("en", { month: "long", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold ${STATUS_STYLES[tenant.subscription_status] ?? "bg-muted text-muted-foreground"}`}>
            {tenant.subscription_status}
          </span>
          <PlanEditor
            tenantId={tenant.id}
            currentPlan={tenant.subscription_plan as "starter" | "track" | "premium"}
            currentStatus={tenant.subscription_status as "active" | "trialing" | "cancelled" | "past_due"}
            isActive={tenant.is_active}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total Members",  value: totalMembers ?? 0,   icon: Users },
          { label: "Active Members", value: activeMembers ?? 0,  icon: Users },
          { label: "All Sessions",   value: totalSessions ?? 0,  icon: Activity },
          { label: "Sessions (30d)", value: recentSessions ?? 0, icon: Calendar },
          { label: "Check-ins",      value: totalCheckins ?? 0,  icon: CheckSquare },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4 text-muted-foreground/60" />
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Members */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Recent Members</p>
          </div>
          <div className="divide-y divide-border">
            {(recentMembers ?? []).length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">No members yet.</p>
            ) : (
              (recentMembers ?? []).map((m) => (
                <div key={m.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {m.first_name} {m.last_name}
                    </p>
                    {m.email && <p className="text-xs text-muted-foreground">{m.email}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex h-5 items-center rounded-full px-2 text-[10px] font-semibold capitalize ${
                      m.status === "active" ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-muted text-muted-foreground"
                    }`}>
                      {m.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {m.joined_at ? new Date(m.joined_at).toLocaleDateString("en", { month: "short", day: "numeric" }) : "—"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Check-ins */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Recent Check-ins</p>
          </div>
          <div className="divide-y divide-border">
            {(recentActivity ?? []).length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">No check-ins yet.</p>
            ) : (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (recentActivity ?? []).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between px-4 py-3">
                  <p className="text-sm text-foreground">
                    {c.members ? `${c.members.first_name} ${c.members.last_name}` : "—"}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs capitalize text-muted-foreground">
                      {(c.checkin_method as string).replace("_", " ")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(c.checkin_at).toLocaleString("en", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
