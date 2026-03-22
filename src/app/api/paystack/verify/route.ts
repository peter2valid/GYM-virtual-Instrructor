import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");
  const tenantId = searchParams.get("tenant_id");
  const plan = searchParams.get("plan");

  if (!reference || !tenantId || !plan) {
    return NextResponse.redirect(new URL("/gym-admin?payment=failed", req.url));
  }

  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  });

  const data = await res.json();

  if (data.data?.status === "success") {
    await adminClient
      .from("tenants")
      .update({
        subscription_plan: plan,
        subscription_status: "active",
        is_active: true,
        paystack_customer_id: data.data.customer?.customer_code ?? null,
      })
      .eq("id", tenantId);

    return NextResponse.redirect(new URL("/gym-admin?payment=success", req.url));
  }

  return NextResponse.redirect(new URL("/gym-admin?payment=failed", req.url));
}
