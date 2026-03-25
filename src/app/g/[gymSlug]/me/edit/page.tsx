import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Mail, LogOut, Shield } from "lucide-react";
import { getAuthUser } from "@/features/auth/actions";
import { getTenantBySlug, getFeatureFlagsForTenant } from "@/features/tenants/queries";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { ProfileForm } from "../ProfileForm";
import { SignOutButton } from "../SignOutButton";

interface Props {
  params: Promise<{ gymSlug: string }>;
}

export const metadata = { title: "Edit Profile" };

export default async function EditProfilePage({ params }: Props) {
  const { gymSlug } = await params;

  const [user, tenant] = await Promise.all([
    getAuthUser(),
    getTenantBySlug(gymSlug),
  ]);

  if (!tenant) notFound();

  const flags = await getFeatureFlagsForTenant(tenant.id);
  if (!flags.member_dashboard) redirect(`/g/${gymSlug}`);

  if (!user) redirect(`/login?next=/g/${gymSlug}/me/edit`);

  const client = await createServerSupabaseClient();
  const { data: profile } = await client
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="flex-1 w-full mx-auto max-w-2xl bg-background pb-28">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="px-5 pt-8 pb-6 flex items-center gap-4">
        <Link
          href={`/g/${gymSlug}/me`}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-card shadow-badge ring-1 ring-border/5 transition-all active:scale-90"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-black tracking-tight text-foreground">Edit Profile</h1>
      </header>

      <div className="px-5 space-y-10">
        {/* ── Profile Section ────────────────────────────────────────── */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 px-2">
            <User className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/40">Personal Info</h2>
          </div>
          
          <div className="rounded-[2.5rem] bg-card p-8 shadow-badge ring-1 ring-border/5">
            <ProfileForm
              initialData={{
                fullName: profile?.full_name ?? "",
                avatarUrl: profile?.avatar_url ?? "",
              }}
              gymSlug={gymSlug}
            />
          </div>
        </section>

        {/* ── Account Section ────────────────────────────────────────── */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 px-2">
            <Shield className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/40">Account & Security</h2>
          </div>
          
          <div className="rounded-[2.5rem] bg-card p-6 shadow-badge ring-1 ring-border/5 divide-y divide-border/40">
            {/* Email (Read only) */}
            <div className="flex items-center justify-between py-4 first:pt-0">
               <div className="flex items-center gap-4">
                 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground/40">
                   <Mail className="h-5 w-5" />
                 </div>
                 <div>
                   <p className="text-[13px] font-bold text-foreground">Email Address</p>
                   <p className="text-xs font-medium text-muted-foreground/60">{user.email}</p>
                 </div>
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 px-2 py-1 bg-muted/30 rounded-lg">Verified</span>
            </div>

            {/* Sign Out */}
            <div className="flex items-center justify-between py-4 last:pb-0">
               <div className="flex items-center gap-4">
                 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500/40">
                   <LogOut className="h-5 w-5" />
                 </div>
                 <div>
                   <p className="text-[13px] font-bold text-foreground">Sign Out</p>
                   <p className="text-xs font-medium text-muted-foreground/60">Securely exit your account</p>
                 </div>
               </div>
               <SignOutButton gymSlug={gymSlug} />
            </div>
          </div>
        </section>

        {/* ── Tip ───────────────────────────────────────────────────── */}
        <p className="text-center text-xs font-medium text-muted-foreground/40 px-8">
          To change your password or delete your account, please contact the platform administrator.
        </p>
      </div>
    </main>
  );
}
