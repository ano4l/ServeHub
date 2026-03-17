"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck2, Compass, Home, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  {
    href: "/",
    label: "Home",
    icon: Home,
    matches: ["/"],
  },
  {
    href: "/explore",
    label: "Explore",
    icon: Compass,
    matches: ["/explore", "/browse", "/providers/"],
  },
  {
    href: "/bookings",
    label: "Bookings",
    icon: CalendarCheck2,
    matches: ["/bookings", "/book", "/dashboard/bookings"],
  },
  {
    href: "/profile",
    label: "Profile",
    icon: UserCircle2,
    matches: ["/profile", "/dashboard/settings"],
  },
] as const;

export function AppTabs() {
  const pathname = usePathname();

  // Hide navigation on auth, admin, dashboard, and provider pages
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/provider") ||
    pathname.startsWith("/admin")
  ) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[70] safe-area-bottom">
      <div className="mx-auto max-w-xl px-4 pb-3">
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-[#0a1525]/90 px-2 py-2 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = tab.matches.some((match) =>
              match.endsWith("/") ? pathname.startsWith(match) : pathname === match,
            );

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "inline-flex h-11 min-h-[44px] min-w-[44px] flex-1 shrink-0 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium transition-all duration-200 active:scale-95",
                  active
                    ? "bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                    : "text-white/50 hover:text-white/80",
                  "focus-visible:outline-2 focus-visible:outline-cyan-400 focus-visible:outline-offset-2",
                )}
                aria-label={`${tab.label} ${active ? "current page" : "navigate to"} page`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <span className="hidden truncate sm:inline">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
