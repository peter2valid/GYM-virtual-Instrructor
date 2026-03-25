import { notFound, redirect } from "next/navigation";
import crypto from "crypto";
import { getTenantBySlug } from "@/features/tenants/queries";
import { getAuthUser } from "@/features/auth/actions";
import { recordCheckin } from "@/features/members/actions";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ gymSlug: string }>;
  searchParams: Promise<{ mid?: string; sig?: string }>;
}

function verifyMemberQrSig(memberId: string, gymId: string, sig: string): boolean {
  const secret = process.env.MEMBER_QR_SECRET ?? process.env.NEXTAUTH_SECRET ?? "dev-secret";
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

export default async function AttendPage({ params, searchParams }: Props) {
  const { gymSlug } = await params;
  const { mid, sig } = await searchParams;

  const tenant = await getTenantBySlug(gymSlug);
  if (!tenant) notFound();

  const client = await createServerSupabaseClient();

  // ── Path 1: Personal member QR (mid + sig params) ──────────────────────────
  if (mid && sig && verifyMemberQrSig(mid, tenant.id, sig)) {
    const { data: member } = await client
      .from("members")
      .select("id")
      .eq("id", mid)
      .eq("gym_id", tenant.id)
      .eq("status", "active")
      .maybeSingle();

    if (member) {
      await recordCheckin({ gymId: tenant.id, memberId: member.id, method: "member_qr" });
    }
    redirect(`/g/${gymSlug}?checked_in=1`);
  }

  // ── Path 2: Logged-in user scans the gym QR ─────────────────────────────
  const user = await getAuthUser();
  if (user) {
    const { data: member } = await client
      .from("members")
      .select("id")
      .eq("gym_id", tenant.id)
      .eq("profile_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (member) {
      await recordCheckin({ gymId: tenant.id, memberId: member.id, method: "qr" });
    }
  }

  redirect(`/g/${gymSlug}?checked_in=1`);
}
