import { redirect } from "next/navigation";
import { getAuthUser } from "@/features/auth/actions";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = { title: "Attendance" };

export default async function GymAdminAttendancePage() {
  const user = await getAuthUser();
  if (!user) redirect("/login?next=/gym-admin/attendance");

  const client = await createServerSupabaseClient();
  const { data: profile } = await client
    .from("profiles")
    .select("tenant_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.tenant_id || !["gym_admin", "super_admin"].includes(profile.role ?? "")) {
    return <div className="py-24 text-center text-sm text-muted-foreground">Access denied.</div>;
  }

  const tenantId = profile.tenant_id;
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // Fetch last 100 check-ins with member name
  const { data: logs } = await client
    .from("attendance_logs")
    .select("id, attendance_date, checked_in_at, source, member_id, profiles(full_name)")
    .eq("tenant_id", tenantId)
    .gte("attendance_date", thirtyDaysAgo)
    .order("checked_in_at", { ascending: false })
    .limit(100);

  // Daily counts for last 14 days
  const { data: dailyCounts } = await client
    .from("attendance_logs")
    .select("attendance_date")
    .eq("tenant_id", tenantId)
    .gte(
      "attendance_date",
      new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    );

  const countByDay: Record<string, number> = {};
  for (const row of dailyCounts ?? []) {
    countByDay[row.attendance_date] = (countByDay[row.attendance_date] ?? 0) + 1;
  }

  const todayCount = countByDay[today] ?? 0;
  const totalThisMonth = logs?.length ?? 0;

  const rows = logs ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
        <p className="text-sm text-muted-foreground">QR check-ins from the last 30 days.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Today" value={todayCount} />
        <StatCard label="Last 30 days" value={totalThisMonth} />
        <StatCard
          label="Daily avg (14d)"
          value={
            Math.round(
              Object.values(countByDay).reduce((a, b) => a + b, 0) /
                Math.max(Object.keys(countByDay).length, 1)
            )
          }
        />
      </div>

      {/* Daily bar chart */}
      <DailyChart countByDay={countByDay} />

      {/* Check-in log */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Recent Check-Ins</p>
        </div>
        {rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            No check-ins recorded yet. Share your QR code to get started.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {/* Header */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2.5 text-xs font-medium text-muted-foreground">
              <span>Member</span>
              <span>Date &amp; Time</span>
              <span>Source</span>
            </div>
            {rows.map((log) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const memberName = (log.profiles as any)?.full_name ?? null;
              const dateStr = log.checked_in_at
                ? new Date(log.checked_in_at).toLocaleString("en", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : log.attendance_date;

              return (
                <div
                  key={log.id}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-3"
                >
                  <span className="text-sm text-foreground">
                    {memberName ?? (
                      <span className="text-muted-foreground">Anonymous</span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">{dateStr}</span>
                  <span className="text-xs capitalize text-muted-foreground">
                    {log.source?.replace("_", " ")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function DailyChart({ countByDay }: { countByDay: Record<string, number> }) {
  // Build last 14 days
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000);
    return d.toISOString().split("T")[0];
  });

  const max = Math.max(...days.map((d) => countByDay[d] ?? 0), 1);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="mb-4 text-sm font-semibold text-foreground">Daily Check-Ins — Last 14 Days</p>
      <div className="flex h-20 items-end gap-1">
        {days.map((day) => {
          const count = countByDay[day] ?? 0;
          const height = Math.max((count / max) * 100, count > 0 ? 8 : 2);
          const isToday = day === new Date().toISOString().split("T")[0];
          return (
            <div
              key={day}
              title={`${day}: ${count}`}
              className="group relative flex-1"
            >
              <div
                style={{ height: `${height}%` }}
                className={`w-full rounded-t transition-colors ${
                  isToday
                    ? "bg-primary"
                    : count > 0
                    ? "bg-primary/40"
                    : "bg-muted"
                }`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
        <span>14d ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}
