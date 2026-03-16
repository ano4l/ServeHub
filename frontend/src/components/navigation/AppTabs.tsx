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
    matches: ["/bookings", "/dashboard/bookings"],
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

  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[70] border-t border-stone-200 bg-white/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-white/85 safe-area-bottom">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-2 overflow-x-auto scrollbar-none">
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
                // Mobile-first touch targets with proper minimum sizes
                "inline-flex h-12 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium transition-all duration-200 active:scale-95",
                // Better spacing for mobile
                "sm:h-11 sm:min-h-[44px] sm:min-w-[74px]",
                // Active and inactive states
                active
                  ? "border-stone-900 bg-stone-900 text-white shadow-lg"
                  : "border-stone-200 bg-white text-stone-600 hover:bg-stone-100 hover:text-stone-900",
                // Focus states for accessibility
                "focus-visible:outline-2 focus-visible:outline-stone-900 focus-visible:outline-offset-2",
              )}
              aria-label={`${tab.label} ${active ? 'current page' : 'navigate to'} page`}
              role="button"
              tabIndex={0}
            >
              <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
