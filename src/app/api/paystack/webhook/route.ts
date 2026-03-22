import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { sendEmail, buildPaymentReceiptEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const SECRET = process.env.PAYSTACK_SECRET_KEY!;
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  // Verify Paystack signature
  const body = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";
  const expected = crypto.createHmac("sha512", SECRET).update(body).digest("hex");

  if (signature !== expected) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);

  if (event.event === "charge.success") {
    const { metadata, customer } = event.data ?? {};
    const tenant_id: string | undefined = metadata?.tenant_id;
    const plan: string | undefined = metadata?.plan;
    const reference: string | undefined = event.data?.reference;

    // Skip if metadata is missing or plan is invalid
    if (!tenant_id || !plan || !["track", "premium"].includes(plan)) {
      return NextResponse.json({ received: true });
    }

    // Idempotency: check if this reference was already processed
    if (reference) {
      const { data: existing } = await adminClient
        .from("tenants")
        .select("paystack_customer_id, subscription_status")
        .eq("id", tenant_id)
        .maybeSingle();
      if (existing?.subscription_status === "active") {
        // Already activated — skip to avoid double-processing
        return NextResponse.json({ received: true });
      }
    }

    // Activate the tenant's subscription
    await adminClient
      .from("tenants")
      .update({
        subscription_plan: plan,
        subscription_status: "active",
        is_active: true,
        paystack_customer_id: customer?.customer_code ?? null,
      })
      .eq("id", tenant_id);

    // Enable plan features
    const isTrack = plan === "track" || plan === "premium";
    const isPremium = plan === "premium";
    const flagUpdates = [
      { feature_key: "member_login",          enabled: isTrack },
      { feature_key: "attendance_tracking",   enabled: isTrack },
      { feature_key: "workout_history",       enabled: isTrack },
      { feature_key: "member_dashboard",      enabled: isTrack },
      { feature_key: "premium_branding",      enabled: isPremium },
      { feature_key: "advanced_analytics",    enabled: isPremium },
      { feature_key: "custom_recommendations",enabled: isPremium },
    ];

    for (const flag of flagUpdates) {
      await adminClient
        .from("feature_flags")
        .update({ enabled: flag.enabled })
        .eq("tenant_id", tenant_id)
        .eq("feature_key", flag.feature_key);
    }

    // Send payment receipt email to the gym admin
    const { data: tenantRow } = await adminClient
      .from("tenants")
      .select("name")
      .eq("id", tenant_id)
      .maybeSingle();

    const adminEmail: string = (customer?.email ?? event.data?.customer?.email ?? "").trim();
    if (adminEmail && adminEmail.includes("@") && tenantRow?.name) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const amountRaw = event.data?.amount ?? 0;
      const currency = event.data?.currency ?? "NGN";
      const amountFormatted = `${currency} ${(amountRaw / 100).toLocaleString("en", { minimumFractionDigits: 2 })}`;

      await sendEmail({
        to: adminEmail,
        subject: `Payment received — ${tenantRow.name} (${plan})`,
        html: buildPaymentReceiptEmail({
          gymName: tenantRow.name,
          adminEmail,
          plan,
          amount: amountFormatted,
          reference: event.data?.reference ?? "",
          dashboardUrl: `${appUrl}/gym-admin`,
        }),
      });
    }
  }

  if (event.event === "subscription.disable" || event.event === "invoice.payment_failed") {
    const tenant_id = event.data?.metadata?.tenant_id;
    if (tenant_id) {
      const newStatus = event.event === "invoice.payment_failed" ? "past_due" : "cancelled";
      await adminClient
        .from("tenants")
        .update({ subscription_status: newStatus })
        .eq("id", tenant_id);

      // Downgrade feature flags back to starter level on cancellation/past_due
      if (newStatus === "cancelled") {
        const paidFlags = [
          "member_login",
          "attendance_tracking",
          "workout_history",
          "member_dashboard",
          "premium_branding",
          "advanced_analytics",
          "custom_recommendations",
        ];
        for (const feature_key of paidFlags) {
          await adminClient
            .from("feature_flags")
            .update({ enabled: false })
            .eq("tenant_id", tenant_id)
            .eq("feature_key", feature_key);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
