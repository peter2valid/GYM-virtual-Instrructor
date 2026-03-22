import { notFound, redirect } from "next/navigation";
import { getTenantBySlug } from "@/features/tenants/queries";
import { getAuthUser } from "@/features/auth/actions";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ gymSlug: string }>;
}

export default async function AttendPage({ params }: Props) {
  const { gymSlug } = await params;

  const tenant = await getTenantBySlug(gymSlug);
  if (!tenant) notFound();

  const user = await getAuthUser();
  const client = await createServerSupabaseClient();

  const today = new Date().toISOString().split("T")[0];
  const now = new Date().toISOString();

  // Log attendance — upsert so duplicate scans on the same day are silently ignored
  await client.from("attendance_logs").upsert(
    {
      tenant_id: tenant.id,
      member_id: user?.id ?? null,
      attendance_date: today,
      checked_in_at: now,
      source: "qr_scan",
    },
    { onConflict: "tenant_id,member_id,attendance_date", ignoreDuplicates: true }
  );

  redirect(`/g/${gymSlug}`);
}
