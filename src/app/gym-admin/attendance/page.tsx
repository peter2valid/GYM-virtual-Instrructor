import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUser } from "@/features/auth/actions";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { getCheckins, getCheckinsCountByDay } from "@/features/members/queries";
import { ROUTES } from "@/lib/constants";

export const metadata = { title: "Attendance" };

export default async function GymAdminAttendancePage() {
  const user = await getAuthUser();
  if (!user) redirect("/login?next=/gym-admin/attendance");

  const client = await createServerSupabaseClient();
  const { data: profile } = await client
    .from("profiles")
    .select("tenant_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.tenant_id || !["gym_admin", "super_admin"].includes(profile.role ?? "")) {
    return <div className="py-24 text-center text-sm text-muted-foreground">Access denied.</div>;
  }

  const gymId = profile.tenant_id;
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [checkins, countByDay] = await Promise.all([
    getCheckins(gymId, 100, thirtyDaysAgo),
    getCheckinsCountByDay(gymId, 14),
  ]);

  const todayCount = Object.entries(countByDay)
    .filter(([day]) => day === today)
    .reduce((s, [, v]) => s + v, 0);

  const totalThisMonth = checkins.length;
  const dailyAvg = Math.round(
    Object.values(countByDay).reduce((a, b) => a + b, 0) /
      Math.max(Object.keys(countByDay).length, 1)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
          <p className="text-sm text-muted-foreground">QR check-ins from the last 30 days.</p>
        </div>
        <Link
          href={ROUTES.GYM_ADMIN_SCANNER}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity shrink-0"
        >
          Open Scanner
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Today" value={todayCount} />
        <StatCard label="Last 30 days" value={totalThisMonth} />
        <StatCard label="Daily avg (14d)" value={dailyAvg} />
      </div>

      <DailyChart countByDay={countByDay} />

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Recent Check-Ins</p>
        </div>
        {checkins.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            No check-ins recorded yet. Share your QR code to get started.
          </p>
        ) : (
          <div className="divide-y divide-border">
            <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2.5 text-xs font-medium text-muted-foreground">
              <span>Member</span>
              <span>Date &amp; Time</span>
              <span>Method</span>
            </div>
            {checkins.map((c) => (
              <div key={c.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-3">
                <div>
                  <p className="text-sm text-foreground">
                    {c.memberName ?? <span className="text-muted-foreground">Unknown member</span>}
                  </p>
                  {c.memberEmail && (
                    <p className="text-xs text-muted-foreground">{c.memberEmail}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(c.checkinAt).toLocaleString("en", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="text-xs capitalize text-muted-foreground">
                  {c.checkinMethod.replace("_", " ")}
                </span>
              </div>
            ))}
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
            <div key={day} title={`${day}: ${count}`} className="group relative flex-1">
              <div
                style={{ height: `${height}%` }}
                className={`w-full rounded-t transition-colors ${
                  isToday ? "bg-primary" : count > 0 ? "bg-primary/40" : "bg-muted"
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
