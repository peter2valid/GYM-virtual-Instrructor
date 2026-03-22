import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase";

export interface SessionWithWorkout {
  id: string;
  workoutId: string;
  workoutTitle: string;
  workoutCategory: string;
  workoutDifficulty: string;
  startedAt: string;
  completedAt: string | null;
  status: "started" | "completed" | "abandoned";
  completionPercent: number | null;
  totalDurationSeconds: number | null;
}

export interface MemberStats {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  favoriteCategory: string | null;
  weeklyData: { week: string; count: number }[];
}

export interface TenantStats {
  totalMembers: number;
  activeToday: number;
  workoutsThisWeek: number;
  completionRate: number;
}

// ─── getSessionHistory ────────────────────────────────────────────────────────

export async function getSessionHistory(
  memberId: string,
  tenantId: string,
  limit = 50
): Promise<SessionWithWorkout[]> {
  if (!isSupabaseConfigured) return [];

  const client = await createServerSupabaseClient();
  const { data, error } = await client
    .from("workout_sessions")
    .select("*, workouts(title, category, difficulty)")
    .eq("member_id", memberId)
    .eq("tenant_id", tenantId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((row: any) => ({
    id: row.id,
    workoutId: row.workout_id,
    workoutTitle: row.workouts?.title ?? "Unknown Workout",
    workoutCategory: row.workouts?.category ?? "",
    workoutDifficulty: row.workouts?.difficulty ?? "beginner",
    startedAt: row.started_at,
    completedAt: row.completed_at,
    status: row.status,
    completionPercent: row.completion_percent,
    totalDurationSeconds: row.total_duration_seconds,
  }));
}

// ─── getMemberStats ───────────────────────────────────────────────────────────

export async function getMemberStats(
  memberId: string,
  tenantId: string
): Promise<MemberStats> {
  const empty: MemberStats = {
    totalSessions: 0,
    totalMinutes: 0,
    currentStreak: 0,
    favoriteCategory: null,
    weeklyData: emptyWeeklyData(),
  };

  if (!isSupabaseConfigured) return empty;

  const client = await createServerSupabaseClient();
  const { data, error } = await client
    .from("workout_sessions")
    .select("completed_at, total_duration_seconds, workouts(category)")
    .eq("member_id", memberId)
    .eq("tenant_id", tenantId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false });

  if (error || !data) return empty;

  const totalSessions = data.length;
  const totalMinutes = Math.round(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.reduce((sum: number, s: any) => sum + (s.total_duration_seconds ?? 0), 0) / 60
  );

  // Favorite category
  const categoryCount: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const s of data as any[]) {
    const cat = s.workouts?.category;
    if (cat) categoryCount[cat] = (categoryCount[cat] ?? 0) + 1;
  }
  const favoriteCategory =
    Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Current streak — consecutive days from today backwards
  const daysSet = new Set(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data as any[])
      .filter((s) => s.completed_at)
      .map((s) => new Date(s.completed_at).toISOString().split("T")[0])
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    if (daysSet.has(key)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  // Weekly data: last 8 weeks
  const weeklyData = buildWeeklyData(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data as any[]).map((s) => s.completed_at).filter(Boolean)
  );

  return { totalSessions, totalMinutes, currentStreak: streak, favoriteCategory, weeklyData };
}

// ─── getTenantStats ───────────────────────────────────────────────────────────

export async function getTenantStats(tenantId: string): Promise<TenantStats> {
  const empty: TenantStats = {
    totalMembers: 0,
    activeToday: 0,
    workoutsThisWeek: 0,
    completionRate: 0,
  };
  if (!isSupabaseConfigured) return empty;

  const client = await createServerSupabaseClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = getWeekStart();
  const monthStart = getMonthStart();

  const [membersRes, todayRes, weekRes, monthRes] = await Promise.all([
    client
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("role", "member"),
    client
      .from("workout_sessions")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .gte("started_at", todayStart.toISOString()),
    client
      .from("workout_sessions")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "completed")
      .gte("started_at", weekStart),
    client
      .from("workout_sessions")
      .select("status")
      .eq("tenant_id", tenantId)
      .gte("started_at", monthStart),
  ]);

  const totalStarted = monthRes.data?.length ?? 0;
  const totalCompleted =
    monthRes.data?.filter((s) => s.status === "completed").length ?? 0;
  const completionRate =
    totalStarted > 0 ? Math.round((totalCompleted / totalStarted) * 100) : 0;

  return {
    totalMembers: membersRes.count ?? 0,
    activeToday: todayRes.count ?? 0,
    workoutsThisWeek: weekRes.count ?? 0,
    completionRate,
  };
}

// ─── getTenantRecentSessions ──────────────────────────────────────────────────

export async function getTenantRecentSessions(
  tenantId: string,
  limit = 10
): Promise<SessionWithWorkout[]> {
  if (!isSupabaseConfigured) return [];

  const client = await createServerSupabaseClient();
  const { data, error } = await client
    .from("workout_sessions")
    .select("*, workouts(title, category, difficulty)")
    .eq("tenant_id", tenantId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((row: any) => ({
    id: row.id,
    workoutId: row.workout_id,
    workoutTitle: row.workouts?.title ?? "Unknown Workout",
    workoutCategory: row.workouts?.category ?? "",
    workoutDifficulty: row.workouts?.difficulty ?? "beginner",
    startedAt: row.started_at,
    completedAt: row.completed_at,
    status: row.status,
    completionPercent: row.completion_percent,
    totalDurationSeconds: row.total_duration_seconds,
  }));
}

// ─── getTenantMembers ─────────────────────────────────────────────────────────

export interface MemberRow {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
}

export async function getTenantMembers(tenantId: string): Promise<MemberRow[]> {
  if (!isSupabaseConfigured) return [];

  const client = await createServerSupabaseClient();
  const { data, error } = await client
    .from("profiles")
    .select("id, full_name, avatar_url, role, created_at")
    .eq("tenant_id", tenantId)
    .eq("role", "member")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((row: any) => ({
    id: row.id,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    role: row.role,
    createdAt: row.created_at,
  }));
}

// ─── getTenantAnalyticsData ───────────────────────────────────────────────────

export interface PopularWorkout {
  workoutId: string;
  title: string;
  category: string;
  sessionCount: number;
  completionRate: number;
}

export interface TenantAnalyticsData {
  totalSessions: number;
  totalMinutes: number;
  completionRate: number;
  activeThisMonth: number;
  activePrevMonth: number;
  retentionChange: number; // percentage points vs previous month
  popularWorkouts: PopularWorkout[];
  weeklyData: { week: string; count: number }[];
}

export async function getTenantAnalyticsData(
  tenantId: string
): Promise<TenantAnalyticsData> {
  const empty: TenantAnalyticsData = {
    totalSessions: 0,
    totalMinutes: 0,
    completionRate: 0,
    activeThisMonth: 0,
    activePrevMonth: 0,
    retentionChange: 0,
    popularWorkouts: [],
    weeklyData: emptyWeeklyData(),
  };

  if (!isSupabaseConfigured) return empty;

  const client = await createServerSupabaseClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // All sessions for the tenant (last 90 days for performance)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const [sessionsRes, prevMonthRes] = await Promise.all([
    client
      .from("workout_sessions")
      .select("id, member_id, status, started_at, completed_at, total_duration_seconds, workouts(id, title, category)")
      .eq("tenant_id", tenantId)
      .gte("started_at", ninetyDaysAgo.toISOString())
      .order("started_at", { ascending: false }),
    client
      .from("workout_sessions")
      .select("member_id")
      .eq("tenant_id", tenantId)
      .gte("started_at", prevMonthStart.toISOString())
      .lt("started_at", monthStart.toISOString()),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessions: any[] = sessionsRes.data ?? [];
  const completed = sessions.filter((s) => s.status === "completed");
  const thisMonthSessions = sessions.filter(
    (s) => new Date(s.started_at) >= monthStart
  );
  const prevMonthSessions = prevMonthRes.data ?? [];

  const totalSessions = completed.length;
  const totalMinutes = Math.round(
    completed.reduce((sum, s) => sum + (s.total_duration_seconds ?? 0), 0) / 60
  );
  const completionRate =
    sessions.length > 0
      ? Math.round((completed.length / sessions.length) * 100)
      : 0;

  const activeThisMonth = new Set(thisMonthSessions.map((s) => s.member_id)).size;
  const activePrevMonth = new Set(prevMonthSessions.map((s: { member_id: string }) => s.member_id)).size;
  const retentionChange =
    activePrevMonth > 0
      ? Math.round(((activeThisMonth - activePrevMonth) / activePrevMonth) * 100)
      : 0;

  // Popular workouts — group by workout_id
  const workoutMap: Record<
    string,
    { title: string; category: string; total: number; done: number }
  > = {};
  for (const s of sessions) {
    const wid = s.workouts?.id ?? s.workout_id;
    if (!wid) continue;
    if (!workoutMap[wid]) {
      workoutMap[wid] = {
        title: s.workouts?.title ?? "Unknown",
        category: s.workouts?.category ?? "",
        total: 0,
        done: 0,
      };
    }
    workoutMap[wid].total++;
    if (s.status === "completed") workoutMap[wid].done++;
  }
  const popularWorkouts: PopularWorkout[] = Object.entries(workoutMap)
    .map(([id, v]) => ({
      workoutId: id,
      title: v.title,
      category: v.category,
      sessionCount: v.total,
      completionRate: v.total > 0 ? Math.round((v.done / v.total) * 100) : 0,
    }))
    .sort((a, b) => b.sessionCount - a.sessionCount)
    .slice(0, 10);

  const weeklyData = buildWeeklyData(
    completed.map((s) => s.completed_at).filter(Boolean)
  );

  return {
    totalSessions,
    totalMinutes,
    completionRate,
    activeThisMonth,
    activePrevMonth,
    retentionChange,
    popularWorkouts,
    weeklyData,
  };
}

// ─── getTenantMembersWithStats ────────────────────────────────────────────────

export interface MemberRowEnriched extends MemberRow {
  sessionCount: number;
  lastActiveAt: string | null;
  segment: "active" | "inactive" | "new";
}

export async function getTenantMembersWithStats(
  tenantId: string
): Promise<MemberRowEnriched[]> {
  if (!isSupabaseConfigured) return [];

  const client = await createServerSupabaseClient();

  const [profilesRes, sessionsRes] = await Promise.all([
    client
      .from("profiles")
      .select("id, full_name, avatar_url, role, created_at")
      .eq("tenant_id", tenantId)
      .eq("role", "member")
      .order("created_at", { ascending: false }),
    client
      .from("workout_sessions")
      .select("member_id, completed_at, status")
      .eq("tenant_id", tenantId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false }),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profiles: any[] = profilesRes.data ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessions: any[] = sessionsRes.data ?? [];

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Build per-member session map
  const memberSessions: Record<string, { count: number; lastAt: string | null }> = {};
  for (const s of sessions) {
    if (!memberSessions[s.member_id]) {
      memberSessions[s.member_id] = { count: 0, lastAt: null };
    }
    memberSessions[s.member_id].count++;
    if (!memberSessions[s.member_id].lastAt) {
      memberSessions[s.member_id].lastAt = s.completed_at;
    }
  }

  return profiles.map((p) => {
    const ms = memberSessions[p.id];
    const sessionCount = ms?.count ?? 0;
    const lastActiveAt = ms?.lastAt ?? null;
    const joinedAt = new Date(p.created_at);

    let segment: "active" | "inactive" | "new" = "inactive";
    if (joinedAt >= thirtyDaysAgo) {
      segment = "new";
    } else if (lastActiveAt && new Date(lastActiveAt) >= sevenDaysAgo) {
      segment = "active";
    }

    return {
      id: p.id,
      fullName: p.full_name,
      avatarUrl: p.avatar_url,
      role: p.role,
      createdAt: p.created_at,
      sessionCount,
      lastActiveAt,
      segment,
    };
  });
}

// ─── getAllTenantsWithStats (super admin) ─────────────────────────────────────

export interface TenantSummaryEnriched {
  id: string;
  name: string;
  slug: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  isActive: boolean;
  createdAt: string;
  memberCount: number;
  sessionCount: number;
}

export async function getAllTenantsWithStats(): Promise<TenantSummaryEnriched[]> {
  if (!isSupabaseConfigured) return [];

  const client = await createServerSupabaseClient();

  const [tenantsRes, profilesRes, sessionsRes] = await Promise.all([
    client
      .from("tenants")
      .select("id, name, slug, subscription_plan, subscription_status, is_active, created_at")
      .order("created_at", { ascending: false }),
    client
      .from("profiles")
      .select("id, tenant_id")
      .eq("role", "member"),
    client
      .from("workout_sessions")
      .select("id, tenant_id")
      .eq("status", "completed"),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tenants: any[] = tenantsRes.data ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profiles: any[] = profilesRes.data ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessions: any[] = sessionsRes.data ?? [];

  const memberCounts: Record<string, number> = {};
  for (const p of profiles) memberCounts[p.tenant_id] = (memberCounts[p.tenant_id] ?? 0) + 1;

  const sessionCounts: Record<string, number> = {};
  for (const s of sessions) sessionCounts[s.tenant_id] = (sessionCounts[s.tenant_id] ?? 0) + 1;

  return tenants.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    subscriptionPlan: t.subscription_plan,
    subscriptionStatus: t.subscription_status ?? "active",
    isActive: t.is_active,
    createdAt: t.created_at,
    memberCount: memberCounts[t.id] ?? 0,
    sessionCount: sessionCounts[t.id] ?? 0,
  }));
}

// ─── getAllTenants (super admin) ──────────────────────────────────────────────

export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  subscriptionPlan: string;
  isActive: boolean;
  createdAt: string;
}

export async function getAllTenants(): Promise<TenantSummary[]> {
  if (!isSupabaseConfigured) return [];

  const client = await createServerSupabaseClient();
  const { data, error } = await client
    .from("tenants")
    .select("id, name, slug, subscription_plan, is_active, created_at")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((row: any) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    subscriptionPlan: row.subscription_plan,
    isActive: row.is_active,
    createdAt: row.created_at,
  }));
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function getWeekStart(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function getMonthStart(): string {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function emptyWeeklyData(): { week: string; count: number }[] {
  return buildWeeklyData([]);
}

function buildWeeklyData(dates: string[]): { week: string; count: number }[] {
  const weeks: { week: string; count: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const start = new Date();
    start.setDate(start.getDate() - i * 7 - start.getDay());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const count = dates.filter((dt) => {
      const d = new Date(dt);
      return d >= start && d < end;
    }).length;
    weeks.push({
      week: start.toLocaleDateString("en", { month: "short", day: "numeric" }),
      count,
    });
  }
  return weeks;
}
