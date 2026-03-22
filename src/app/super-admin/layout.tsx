import Link from "next/link";
import { ROUTES } from "@/lib/constants";

const navItems = [
  { href: ROUTES.SUPER_ADMIN, label: "Dashboard" },
  { href: ROUTES.SUPER_ADMIN_GYMS, label: "All Gyms" },
  { href: ROUTES.SUPER_ADMIN_SUBSCRIPTIONS, label: "Subscriptions" },
  { href: ROUTES.SUPER_ADMIN_SUPPORT, label: "Support" },
];

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-56 flex-shrink-0 flex-col border-r border-border md:flex">
        <div className="flex h-14 items-center border-b border-border px-4">
          <span className="text-sm font-semibold text-foreground">
            Super Admin
          </span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex h-9 items-center rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center border-b border-border px-4 md:hidden">
          <span className="text-sm font-semibold text-foreground">
            Super Admin
          </span>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
