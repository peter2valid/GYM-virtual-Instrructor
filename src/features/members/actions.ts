"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/features/auth/actions";

// ─── helper: resolve caller's gym_id + assert admin ──────────────────────────

async function getCallerGymId(): Promise<{ gymId: string } | { error: string }> {
  const user = await getAuthUser();
  if (!user) return { error: "Not authenticated" };

  const client = await createServerSupabaseClient();
  const { data: profile } = await client
    .from("profiles")
    .select("tenant_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.tenant_id || !["gym_admin", "super_admin"].includes(profile.role ?? "")) {
    return { error: "Access denied" };
  }

  return { gymId: profile.tenant_id };
}

// ─── createMembershipType ─────────────────────────────────────────────────────

export async function createMembershipType(input: {
  name: string;
  description?: string;
  durationDays: number;
  priceKes: number;
  attendanceLimit?: number | null;
  includesWorkouts: boolean;
}) {
  const res = await getCallerGymId();
  if ("error" in res) return res;

  const client = await createServerSupabaseClient();
  const { error } = await client.from("membership_types").insert({
    gym_id: res.gymId,
    name: input.name,
    description: input.description ?? null,
    duration_days: input.durationDays,
    price_kes: input.priceKes,
    attendance_limit: input.attendanceLimit ?? null,
    includes_workouts: input.includesWorkouts,
    is_active: true,
  });

  if (error) return { error: error.message };

  revalidatePath("/gym-admin/members");
  return { success: true };
}

// ─── updateMembershipType ─────────────────────────────────────────────────────

export async function updateMembershipType(
  id: string,
  input: Partial<{
    name: string;
    description: string | null;
    durationDays: number;
    priceKes: number;
    attendanceLimit: number | null;
    includesWorkouts: boolean;
    isActive: boolean;
  }>
) {
  const res = await getCallerGymId();
  if ("error" in res) return res;

  const client = await createServerSupabaseClient();
  const { error } = await client
    .from("membership_types")
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.durationDays !== undefined && { duration_days: input.durationDays }),
      ...(input.priceKes !== undefined && { price_kes: input.priceKes }),
      ...(input.attendanceLimit !== undefined && { attendance_limit: input.attendanceLimit }),
      ...(input.includesWorkouts !== undefined && { includes_workouts: input.includesWorkouts }),
      ...(input.isActive !== undefined && { is_active: input.isActive }),
    })
    .eq("id", id)
    .eq("gym_id", res.gymId);

  if (error) return { error: error.message };

  revalidatePath("/gym-admin/members");
  return { success: true };
}

// ─── deleteMembershipType ─────────────────────────────────────────────────────

export async function deleteMembershipType(id: string) {
  const res = await getCallerGymId();
  if ("error" in res) return res;

  const client = await createServerSupabaseClient();
  // Soft-delete: mark inactive (safe if memberships reference this type)
  const { error } = await client
    .from("membership_types")
    .update({ is_active: false })
    .eq("id", id)
    .eq("gym_id", res.gymId);

  if (error) return { error: error.message };

  revalidatePath("/gym-admin/members");
  return { success: true };
}

// ─── assignMembership ─────────────────────────────────────────────────────────

export async function assignMembership(input: {
  memberId: string;
  membershipTypeId: string;
  startDate: string;
  amountPaidKes: number;
  paymentStatus: "paid" | "partial" | "unpaid" | "waived";
  autoRenew: boolean;
}) {
  const res = await getCallerGymId();
  if ("error" in res) return res;

  const client = await createServerSupabaseClient();

  // Fetch the membership type to calculate end_date
  const { data: mtype, error: mtErr } = await client
    .from("membership_types")
    .select("duration_days")
    .eq("id", input.membershipTypeId)
    .eq("gym_id", res.gymId)
    .maybeSingle();

  if (mtErr || !mtype) return { error: "Membership type not found" };

  const start = new Date(input.startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + mtype.duration_days);
  const endDate = end.toISOString().split("T")[0];

  const { error } = await client.from("member_memberships").insert({
    gym_id: res.gymId,
    member_id: input.memberId,
    membership_type_id: input.membershipTypeId,
    start_date: input.startDate,
    end_date: endDate,
    status: "active",
    payment_status: input.paymentStatus,
    amount_paid_kes: input.amountPaidKes,
    auto_renew: input.autoRenew,
  });

  if (error) return { error: error.message };

  revalidatePath("/gym-admin/members");
  return { success: true, endDate };
}

// ─── recordCheckin ────────────────────────────────────────────────────────────
// Used by the member-facing QR attend page (called server-side)

export async function recordCheckin({
  gymId,
  memberId,
  method = "qr",
}: {
  gymId: string;
  memberId: string;
  method?: "qr" | "member_qr" | "manual" | "staff" | "kiosk";
}) {
  const client = await createServerSupabaseClient();

  // Prevent duplicate check-ins within 1 hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: recent } = await client
    .from("attendance_checkins")
    .select("id")
    .eq("gym_id", gymId)
    .eq("member_id", memberId)
    .gte("checkin_at", oneHourAgo)
    .maybeSingle();

  if (recent) return { alreadyCheckedIn: true };

  const { error } = await client.from("attendance_checkins").insert({
    gym_id: gymId,
    member_id: memberId,
    checkin_method: method,
    status: "entered",
  });

  if (error) return { error: error.message };
  return { success: true };
}
