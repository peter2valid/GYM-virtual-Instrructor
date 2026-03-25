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

// ─── row mapper ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSession(row: any): SessionWithWorkout {
  const wt = row.workout_templates ?? row.workouts ?? null;
  return {
    id: row.id,
    workoutId: row.workout_template_id ?? row.workout_id,
    workoutTitle: wt?.title ?? "Unknown Workout",
    workoutCategory: wt?.category ?? "",
    workoutDifficulty: wt?.difficulty ?? "beginner",
    startedAt: row.started_at,
    completedAt: row.completed_at,
    status: row.status,
    completionPercent: row.completion_percent,
    totalDurationSeconds: row.total_duration_seconds,
  };
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
    .select("*, workout_templates(title, category, difficulty)")
    .eq("member_id", memberId)
    .eq("tenant_id", tenantId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map(mapSession);
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
    .select("completed_at, total_duration_seconds, workout_templates(category)")
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

  const categoryCount: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const s of data as any[]) {
    const cat = s.workout_templates?.category;
    if (cat) categoryCount[cat] = (categoryCount[cat] ?? 0) + 1;
  }
  const favoriteCategory =
    Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

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

  const [membersRes, todayRes, weekRes, monthRes] = await Promise.all([
    // V2: count from members table
    client
      .from("members")
      .select("id", { count: "exact", head: true })
      .eq("gym_id", tenantId)
      .eq("status", "active"),
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
      .gte("started_at", getWeekStart()),
    client
      .from("workout_sessions")
      .select("status")
      .eq("tenant_id", tenantId)
      .gte("started_at", getMonthStart()),
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
    .select("*, workout_templates(title, category, difficulty)")
    .eq("tenant_id", tenantId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map(mapSession);
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
    .from("members")
    .select("id, full_name, photo_url, status, joined_at")
    .eq("gym_id", tenantId)
    .order("joined_at", { ascending: false });

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((row: any) => ({
    id: row.id,
    fullName: row.full_name,
    avatarUrl: row.photo_url,
    role: "member",
    createdAt: row.joined_at,
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
  retentionChange: number;
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
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const [sessionsRes, prevMonthRes] = await Promise.all([
    client
      .from("workout_sessions")
      .select("id, member_id, status, started_at, completed_at, total_duration_seconds, workout_template_id, workout_templates(id, title, category)")
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
      : activeThisMonth > 0 ? 100 : 0;

  const workoutMap: Record<string, { title: string; category: string; total: number; done: number }> = {};
  for (const s of sessions) {
    const wt = s.workout_templates;
    const wid = wt?.id ?? s.workout_template_id ?? s.workout_id;
    if (!wid) continue;
    if (!workoutMap[wid]) {
      workoutMap[wid] = { title: wt?.title ?? "Unknown", category: wt?.category ?? "", total: 0, done: 0 };
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

  return { totalSessions, totalMinutes, completionRate, activeThisMonth, activePrevMonth, retentionChange, popularWorkouts, weeklyData };
}

// ─── getTenantMembersWithStats ────────────────────────────────────────────────

export interface MemberRowEnriched extends MemberRow {
  sessionCount: number;
  lastActiveAt: string | null;
  segment: "active" | "inactive" | "new";
  // V2 extras
  phone: string | null;
  email: string | null;
  status: string;
  memberCode: string | null;
}

export async function getTenantMembersWithStats(
  tenantId: string
): Promise<MemberRowEnriched[]> {
  if (!isSupabaseConfigured) return [];

  const client = await createServerSupabaseClient();

  const [membersRes, sessionsRes] = await Promise.all([
    client
      .from("members")
      .select("id, full_name, photo_url, phone, email, status, member_code, joined_at")
      .eq("gym_id", tenantId)
      .order("joined_at", { ascending: false }),
    client
      .from("workout_sessions")
      .select("member_id, completed_at, status")
      .eq("tenant_id", tenantId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false }),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const members: any[] = membersRes.data ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessions: any[] = sessionsRes.data ?? [];

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

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

  return members.map((m) => {
    const ms = memberSessions[m.id];
    const sessionCount = ms?.count ?? 0;
    const lastActiveAt = ms?.lastAt ?? null;
    const joinedAt = new Date(m.joined_at);

    let segment: "active" | "inactive" | "new" = "inactive";
    if (joinedAt >= thirtyDaysAgo) {
      segment = "new";
    } else if (lastActiveAt && new Date(lastActiveAt) >= sevenDaysAgo) {
      segment = "active";
    }

    return {
      id: m.id,
      fullName: m.full_name,
      avatarUrl: m.photo_url,
      role: "member",
      createdAt: m.joined_at,
      phone: m.phone,
      email: m.email,
      status: m.status,
      memberCode: m.member_code,
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

  const [tenantsRes, membersRes, sessionsRes] = await Promise.all([
    client
      .from("tenants")
      .select("id, name, slug, subscription_plan, subscription_status, is_active, created_at")
      .order("created_at", { ascending: false }),
    // V2: count from members table
    client
      .from("members")
      .select("id, gym_id")
      .eq("status", "active"),
    client
      .from("workout_sessions")
      .select("id, tenant_id")
      .eq("status", "completed"),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tenants: any[] = tenantsRes.data ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const membersList: any[] = membersRes.data ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessions: any[] = sessionsRes.data ?? [];

  const memberCounts: Record<string, number> = {};
  for (const m of membersList) memberCounts[m.gym_id] = (memberCounts[m.gym_id] ?? 0) + 1;

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

// ─── getMemberHeatmapData ─────────────────────────────────────────────────────

export async function getMemberHeatmapData(
  memberId: string,
  tenantId: string
): Promise<string[]> {
  if (!isSupabaseConfigured) return [];

  const client = await createServerSupabaseClient();
  const { data, error } = await client
    .from("workout_sessions")
    .select("completed_at")
    .eq("member_id", memberId)
    .eq("tenant_id", tenantId)
    .eq("status", "completed")
    .order("completed_at", { ascending: true });

  if (error || !data) return [];

  return data
    .map((s) => s.completed_at)
    .filter(Boolean)
    .map((dt) => new Date(dt).toISOString().split("T")[0]);
}

// ─── getGymLeaderboard ────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  profileId: string;
  fullName: string | null;
  avatarUrl: string | null;
  streak: number;
}

export async function getGymLeaderboard(
  tenantId: string,
  limit = 10
): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured) return [];

  const client = await createServerSupabaseClient();

  const [membersRes, sessionsRes] = await Promise.all([
    // profile_id links member row → auth user (workout_sessions.member_id = auth user id)
    client
      .from("members")
      .select("id, full_name, photo_url, profile_id")
      .eq("gym_id", tenantId)
      .eq("status", "active")
      .not("profile_id", "is", null),
    client
      .from("workout_sessions")
      .select("member_id, completed_at")
      .eq("tenant_id", tenantId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false }),
  ]);

  if (!membersRes.data || !sessionsRes.data) return [];

  // Key sessions by auth user id (= profile_id on member row)
  const memberSessions: Record<string, Set<string>> = {};
  for (const s of sessionsRes.data) {
    if (!s.completed_at) continue;
    if (!memberSessions[s.member_id]) memberSessions[s.member_id] = new Set();
    memberSessions[s.member_id].add(new Date(s.completed_at).toISOString().split("T")[0]);
  }

  const leaderboard: LeaderboardEntry[] = membersRes.data.map((m) => {
    // match via profile_id (auth UID) → workout_sessions.member_id
    const daysSet = memberSessions[m.profile_id] || new Set();
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
    return { profileId: m.id, fullName: m.full_name, avatarUrl: m.photo_url, streak };
  });

  return leaderboard
    .sort((a, b) => b.streak - a.streak)
    .filter((e) => e.streak > 0)
    .slice(0, limit);
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
  const now = new Date();
  const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - dayOfWeek);
  thisMonday.setHours(0, 0, 0, 0);

  for (let i = 7; i >= 0; i--) {
    const start = new Date(thisMonday);
    start.setDate(thisMonday.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
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
