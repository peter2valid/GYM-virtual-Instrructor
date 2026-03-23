import { ROUTES } from "@/lib/constants";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getAuthUser } from "@/features/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const navItems = [
  { href: ROUTES.SUPER_ADMIN, label: "Dashboard" },
  { href: ROUTES.SUPER_ADMIN_GYMS, label: "All Gyms", shortLabel: "Gyms" },
  { href: ROUTES.SUPER_ADMIN_SUBSCRIPTIONS, label: "Subscriptions", shortLabel: "Billing" },
  { href: ROUTES.SUPER_ADMIN_SUPPORT, label: "Support" },
];

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();
  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") {
    redirect(ROUTES.HOME);
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-56 flex-shrink-0 flex-col border-r border-border md:flex">
        <div className="flex h-14 items-center border-b border-border px-4">
          <span className="text-sm font-semibold text-foreground">
            Super Admin
          </span>
        </div>
        <AdminSidebarNav items={navItems} />
        <div className="mt-auto border-t border-border p-4">
          <ThemeToggle />
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border px-4 md:hidden">
          <span className="text-sm font-semibold text-foreground">
            Super Admin
          </span>
          <ThemeToggle />
        </header>
        <main className="flex-1 p-4 pb-20 md:p-6 md:pb-6">{children}</main>
      </div>
      <AdminMobileNav items={navItems} />
    </div>
  );
}
