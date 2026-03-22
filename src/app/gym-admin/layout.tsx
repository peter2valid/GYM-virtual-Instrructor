import { ROUTES } from "@/lib/constants";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";

const navItems = [
  { href: ROUTES.GYM_ADMIN, label: "Dashboard" },
  { href: ROUTES.GYM_ADMIN_MEMBERS, label: "Members" },
  { href: ROUTES.GYM_ADMIN_WORKOUTS, label: "Workouts" },
  { href: ROUTES.GYM_ADMIN_ANALYTICS, label: "Analytics" },
  { href: ROUTES.GYM_ADMIN_ATTENDANCE, label: "Attendance" },
  { href: ROUTES.GYM_ADMIN_QR, label: "QR Code", shortLabel: "QR" },
  { href: ROUTES.GYM_ADMIN_SETTINGS, label: "Settings" },
];

export default function GymAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-56 flex-shrink-0 flex-col border-r border-border md:flex">
        <div className="flex h-14 items-center border-b border-border px-4">
          <span className="text-sm font-semibold text-foreground">
            Gym Admin
          </span>
        </div>
        <AdminSidebarNav items={navItems} />
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center border-b border-border px-4 md:hidden">
          <span className="text-sm font-semibold text-foreground">
            Gym Admin
          </span>
        </header>
        <main className="flex-1 p-4 pb-20 md:p-6 md:pb-6">{children}</main>
      </div>
      <AdminMobileNav items={navItems} />
    </div>
  );
}
