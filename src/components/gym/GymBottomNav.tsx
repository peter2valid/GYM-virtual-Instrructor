"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, TrendingUp, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Props {
  gymSlug: string;
  showProgress?: boolean;
  showMe?: boolean;
}

export function GymBottomNav({ gymSlug, showProgress = true, showMe = true }: Props) {
  const pathname = usePathname();

  const tabs = [
    {
      href: `/g/${gymSlug}`,
      label: "Home",
      icon: Home,
      exact: true,
      show: true,
    },
    {
      href: `/g/${gymSlug}/workouts`,
      label: "Workouts",
      icon: Dumbbell,
      exact: false,
      show: true,
    },
    {
      href: `/g/${gymSlug}/progress`,
      label: "Progress",
      icon: TrendingUp,
      exact: false,
      show: showProgress,
    },
    {
      href: `/g/${gymSlug}/me`,
      label: "Me",
      icon: User,
      exact: false,
      show: showMe,
    },
  ].filter((t) => t.show);

  // Hide on session pages and workout detail pages — full-screen / pre-start experience
  if (pathname.includes("/session")) return null;
  if (/\/workouts\/[^/]+$/.test(pathname)) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md safe-area-pb">
      <div className="mx-auto flex max-w-2xl">
        {tabs.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform",
                    active && "scale-110"
                  )}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                {active && (
                  <span className="absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </div>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
