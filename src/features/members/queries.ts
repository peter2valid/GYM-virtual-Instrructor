import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MembershipType {
  id: string;
  gymId: string;
  name: string;
  description: string | null;
  durationDays: number;
  priceKes: number;
  attendanceLimit: number | null;
  includesWorkouts: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface MemberMembership {
  id: string;
  memberId: string;
  memberName: string | null;
  membershipTypeId: string;
  membershipTypeName: string;
  startDate: string;
  endDate: string;
  status: string;
  paymentStatus: string;
  amountPaidKes: number;
  autoRenew: boolean;
  createdAt: string;
}

export interface CheckinRow {
  id: string;
  memberId: string;
  memberName: string | null;
  memberEmail: string | null;
  checkinAt: string;
  checkoutAt: string | null;
  checkinMethod: string;
  status: string;
  denialReason: string | null;
}

// ─── getMembershipTypes ───────────────────────────────────────────────────────

export async function getMembershipTypes(gymId: string): Promise<MembershipType[]> {
  if (!isSupabaseConfigured) return [];

  const client = await createServerSupabaseClient();
  const { data, error } = await client
    .from("membership_types")
    .select("*")
    .eq("gym_id", gymId)
    .order("price_kes", { ascending: true });

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((r: any) => ({
    id: r.id,
    gymId: r.gym_id,
    name: r.name,
    description: r.description,
    durationDays: r.duration_days,
    priceKes: r.price_kes,
    attendanceLimit: r.attendance_limit,
    includesWorkouts: r.includes_workouts,
    isActive: r.is_active,
    createdAt: r.created_at,
  }));
}

// ─── getMemberMemberships ─────────────────────────────────────────────────────

export async function getMemberMemberships(gymId: string): Promise<MemberMembership[]> {
  if (!isSupabaseConfigured) return [];

  const client = await createServerSupabaseClient();
  const { data, error } = await client
    .from("member_memberships")
    .select("*, members(full_name), membership_types(name)")
    .eq("gym_id", gymId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((r: any) => ({
    id: r.id,
    memberId: r.member_id,
    memberName: r.members?.full_name ?? null,
    membershipTypeId: r.membership_type_id,
    membershipTypeName: r.membership_types?.name ?? "—",
    startDate: r.start_date,
    endDate: r.end_date,
    status: r.status,
    paymentStatus: r.payment_status,
    amountPaidKes: r.amount_paid_kes,
    autoRenew: r.auto_renew,
    createdAt: r.created_at,
  }));
}

// ─── getCheckins ──────────────────────────────────────────────────────────────

export async function getCheckins(
  gymId: string,
  limit = 100,
  since?: string
): Promise<CheckinRow[]> {
  if (!isSupabaseConfigured) return [];

  const client = await createServerSupabaseClient();
  let q = client
    .from("attendance_checkins")
    .select("*, members(full_name, email)")
    .eq("gym_id", gymId)
    .order("checkin_at", { ascending: false })
    .limit(limit);

  if (since) q = q.gte("checkin_at", since);

  const { data, error } = await q;
  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((r: any) => ({
    id: r.id,
    memberId: r.member_id,
    memberName: r.members?.full_name ?? null,
    memberEmail: r.members?.email ?? null,
    checkinAt: r.checkin_at,
    checkoutAt: r.checkout_at,
    checkinMethod: r.checkin_method,
    status: r.status,
    denialReason: r.denial_reason,
  }));
}

// ─── getCheckinsCountByDay ────────────────────────────────────────────────────

export async function getCheckinsCountByDay(
  gymId: string,
  days = 14
): Promise<Record<string, number>> {
  if (!isSupabaseConfigured) return {};

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const client = await createServerSupabaseClient();
  const { data, error } = await client
    .from("attendance_checkins")
    .select("checkin_at")
    .eq("gym_id", gymId)
    .gte("checkin_at", since);

  if (error || !data) return {};

  const counts: Record<string, number> = {};
  for (const r of data) {
    const day = new Date(r.checkin_at).toISOString().split("T")[0];
    counts[day] = (counts[day] ?? 0) + 1;
  }
  return counts;
}
