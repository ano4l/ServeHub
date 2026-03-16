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

  return (
    <nav className="flex items-center gap-2 overflow-x-auto scrollbar-none">
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
              "inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition",
              active
                ? "border-white/15 bg-white text-black"
                : "border-white/10 bg-white/6 text-white/78 hover:bg-white/12 hover:text-white",
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
