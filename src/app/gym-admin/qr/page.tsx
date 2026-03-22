import { redirect } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { getAuthUser } from "@/features/auth/actions";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { QrDownloadButton, QrPrintButton } from "./QrDownloadButton";

export const metadata = { title: "Check-In QR Code" };

export default async function GymAdminQrPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login?next=/gym-admin/qr");

  const client = await createServerSupabaseClient();
  const { data: profile } = await client
    .from("profiles")
    .select("tenant_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.tenant_id || !["gym_admin", "super_admin"].includes(profile.role ?? "")) {
    return (
      <div className="py-24 text-center text-sm text-muted-foreground">Access denied.</div>
    );
  }

  const { data: tenant } = await client
    .from("tenants")
    .select("slug, name")
    .eq("id", profile.tenant_id)
    .maybeSingle();

  if (!tenant) return null;

  // Build absolute URL from request host
  const reqHeaders = await headers();
  const host = reqHeaders.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const checkInUrl = `${protocol}://${host}/g/${tenant.slug}/attend`;

  // Generate QR as data URL (runs server-side)
  const qrDataUrl = await QRCode.toDataURL(checkInUrl, {
    width: 320,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Check-In QR Code</h1>
        <p className="text-sm text-muted-foreground">
          Print or display this at your entrance. Members scan to log attendance.
        </p>
      </div>

      <div className="flex flex-col items-center gap-6 rounded-xl border border-border bg-card p-8">
        {/* QR Code */}
        <div className="rounded-xl bg-white p-4 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="Check-in QR code" width={280} height={280} />
        </div>

        {/* Gym name + URL */}
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">{tenant.name}</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground break-all">{checkInUrl}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <QrDownloadButton dataUrl={qrDataUrl} gymName={tenant.name} />
          <QrPrintButton />
        </div>
      </div>

      {/* Stats card */}
      <AttendanceStats tenantId={profile.tenant_id} client={client} />
    </div>
  );
}

// ─── Attendance stats (server component) ─────────────────────────────────────

async function AttendanceStats({
  tenantId,
  client,
}: {
  tenantId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any;
}) {
  const today = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [{ count: todayCount }, { count: weekCount }] = await Promise.all([
    client
      .from("attendance_logs")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("attendance_date", today),
    client
      .from("attendance_logs")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .gte("attendance_date", sevenDaysAgo),
  ]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">Check-ins Today</p>
        <p className="mt-1 text-2xl font-bold text-foreground">{todayCount ?? 0}</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">Check-ins (7 days)</p>
        <p className="mt-1 text-2xl font-bold text-foreground">{weekCount ?? 0}</p>
      </div>
    </div>
  );
}
