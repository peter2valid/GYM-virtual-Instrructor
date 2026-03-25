"use server";

import crypto from "crypto";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/features/auth/actions";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MemberScanResult {
  mode: "checkin" | "checkout";
  checkinId: string | null;            // existing open checkin ID (for checkout)
  member: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    memberCode: string | null;
    avatarUrl: string | null;
    status: string;
  };
  membership: {
    planName: string;
    status: string;
    endDate: string;
    daysLeft: number;
  } | null;
  lastCheckin: {
    checkinAt: string;
    checkoutAt: string | null;
  } | null;
  checkinAt: string | null;           // populated on checkout — when they checked in
}

export type ScanResponse =
  | { ok: true; result: MemberScanResult }
  | { ok: false; error: string };

// ─── Verify HMAC signature ────────────────────────────────────────────────────

function verifySig(memberId: string, gymId: string, sig: string): boolean {
  const secret = process.env.MEMBER_QR_SECRET ?? "dev-secret";
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${memberId}:${gymId}`)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

// ─── processMemberScan ────────────────────────────────────────────────────────
// Called after the scanner decodes a QR URL.
// Verifies the sig, loads member data, determines check-in vs check-out.

export async function processMemberScan(
  memberId: string,
  sig: string,
  gymId: string
): Promise<ScanResponse> {
  // 1. Auth: caller must be gym staff
  const user = await getAuthUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  if (!verifySig(memberId, gymId, sig)) {
    return { ok: false, error: "Invalid QR code" };
  }

  const client = await createServerSupabaseClient();

  // 2. Verify staff belongs to this gym
  const { data: profile } = await client
    .from("profiles")
    .select("tenant_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profile?.tenant_id !== gymId ||
    !["gym_admin", "super_admin"].includes(profile.role ?? "")
  ) {
    return { ok: false, error: "Access denied" };
  }

  // 3. Load member + membership
  const { data: member, error: memberErr } = await client
    .from("members")
    .select(`
      id, first_name, last_name, email, phone, member_code, status,
      profiles(avatar_url),
      member_memberships(
        id, status, end_date,
        membership_types(name)
      )
    `)
    .eq("id", memberId)
    .eq("gym_id", gymId)
    .maybeSingle();

  if (memberErr || !member) {
    return { ok: false, error: "Member not found" };
  }

  if (member.status !== "active") {
    return { ok: false, error: `Member is ${member.status}` };
  }

  // 4. Find open check-in (no checkout_at) within last 24h
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: openCheckin } = await client
    .from("attendance_checkins")
    .select("id, checkin_at, checkout_at")
    .eq("gym_id", gymId)
    .eq("member_id", memberId)
    .is("checkout_at", null)
    .gte("checkin_at", twentyFourHoursAgo)
    .order("checkin_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 5. Most recent checkin for display
  const { data: lastCheckin } = await client
    .from("attendance_checkins")
    .select("checkin_at, checkout_at")
    .eq("gym_id", gymId)
    .eq("member_id", memberId)
    .order("checkin_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 6. Build active membership summary
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memberships = (member.member_memberships as any[]) ?? [];
  const activeMembership = memberships
    .filter((m: { status: string }) => m.status === "active")
    .sort(
      (a: { end_date: string }, b: { end_date: string }) =>
        new Date(b.end_date).getTime() - new Date(a.end_date).getTime()
    )[0] ?? null;

  const membershipSummary = activeMembership
    ? {
        planName: activeMembership.membership_types?.name ?? "Membership",
        status: activeMembership.status,
        endDate: activeMembership.end_date,
        daysLeft: Math.max(
          0,
          Math.ceil((new Date(activeMembership.end_date).getTime() - Date.now()) / 86400000)
        ),
      }
    : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const avatarUrl = (member.profiles as any)?.avatar_url ?? null;
  const fullName = `${member.first_name} ${member.last_name}`.trim();

  return {
    ok: true,
    result: {
      mode: openCheckin ? "checkout" : "checkin",
      checkinId: openCheckin?.id ?? null,
      member: {
        id: member.id,
        firstName: member.first_name,
        lastName: member.last_name,
        fullName,
        email: member.email,
        phone: member.phone,
        memberCode: member.member_code,
        avatarUrl,
        status: member.status,
      },
      membership: membershipSummary,
      lastCheckin: lastCheckin
        ? { checkinAt: lastCheckin.checkin_at, checkoutAt: lastCheckin.checkout_at }
        : null,
      checkinAt: openCheckin?.checkin_at ?? null,
    },
  };
}

// ─── confirmCheckin ───────────────────────────────────────────────────────────

export async function confirmCheckin(
  memberId: string,
  gymId: string
): Promise<{ ok: true; checkinId: string } | { ok: false; error: string }> {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const client = await createServerSupabaseClient();

  // Dedup: skip if already checked in within the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: recent } = await client
    .from("attendance_checkins")
    .select("id")
    .eq("gym_id", gymId)
    .eq("member_id", memberId)
    .is("checkout_at", null)
    .gte("checkin_at", oneHourAgo)
    .maybeSingle();

  if (recent) return { ok: true, checkinId: recent.id };

  const { data, error } = await client
    .from("attendance_checkins")
    .insert({
      gym_id: gymId,
      member_id: memberId,
      checkin_method: "staff_scan",
      status: "entered",
      checked_in_by_profile_id: user.id,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Failed" };
  return { ok: true, checkinId: data.id };
}

// ─── confirmCheckout ──────────────────────────────────────────────────────────

export async function confirmCheckout(
  checkinId: string,
  gymId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const client = await createServerSupabaseClient();
  const { error } = await client
    .from("attendance_checkins")
    .update({
      checkout_at: new Date().toISOString(),
      status: "exited",
    })
    .eq("id", checkinId)
    .eq("gym_id", gymId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
