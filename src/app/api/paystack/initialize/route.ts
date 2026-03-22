import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/features/auth/actions";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

const PLAN_PRICES: Record<string, number> = {
  track:   1500000, // ₦15,000 in kobo
  premium: 3000000, // ₦30,000 in kobo
};

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan, tenantId } = await req.json();

  if (!plan || !PLAN_PRICES[plan]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const client = await createServerSupabaseClient();
  const { data: profile } = await client
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .maybeSingle();

  // Verify the tenant belongs to this user
  const resolvedTenantId = profile?.tenant_id ?? tenantId;
  if (!resolvedTenantId) {
    return NextResponse.json({ error: "No gym associated with your account" }, { status: 400 });
  }

  const { data: tenant } = await client
    .from("tenants")
    .select("name, slug")
    .eq("id", resolvedTenantId)
    .maybeSingle();

  if (!tenant) return NextResponse.json({ error: "Gym not found" }, { status: 404 });

  const origin = req.headers.get("origin") ?? "http://localhost:3000";
  const callbackUrl = `${origin}/api/paystack/verify?tenant_id=${resolvedTenantId}&plan=${plan}`;

  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      amount: PLAN_PRICES[plan],
      callback_url: callbackUrl,
      metadata: {
        tenant_id: resolvedTenantId,
        plan,
        gym_name: tenant.name,
        user_id: user.id,
      },
    }),
  });

  const data = await response.json();

  if (!data.status) {
    return NextResponse.json({ error: data.message ?? "Paystack error" }, { status: 500 });
  }

  return NextResponse.json({ authorization_url: data.data.authorization_url });
}
