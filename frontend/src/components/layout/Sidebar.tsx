"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  CalendarCheck,
  Compass,
  ChevronLeft,
  ChevronRight,
  FileText,
  Layers,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  ShieldCheck,
  Star,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";

const customerNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/dashboard/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/settings", label: "Profile", icon: Settings },
];

const providerNav = [
  { href: "/provider", label: "Dashboard", icon: LayoutDashboard },
  { href: "/provider/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/provider/messages", label: "Messages", icon: MessageSquare },
  { href: "/provider/services", label: "Services", icon: Wrench },
  { href: "/provider/wallet", label: "Wallet", icon: Wallet },
  { href: "/provider/reviews", label: "Reviews", icon: Star },
  { href: "/provider/settings", label: "Settings", icon: Settings },
];

const adminNav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/verifications", label: "Verifications", icon: ShieldCheck },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/admin/disputes", label: "Disputes", icon: AlertTriangle },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/categories", label: "Catalog", icon: Layers },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: FileText },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function getNav(role?: string) {
  switch (role) {
    case "ADMIN":
      return adminNav;
    case "PROVIDER":
      return providerNav;
    default:
      return customerNav;
  }
}

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user, clearAuth } = useAuthStore();
  const nav = getNav(user?.activeRole);

  return (
    <aside
      className={cn(
        "relative hidden md:flex md:flex-col md:shrink-0 md:overflow-hidden md:rounded-[32px] liquid-dark glass-hairline surface-ring md:ml-4 md:my-3 md:border md:border-white/10 md:px-3 md:py-3",
        sidebarCollapsed ? "md:w-20" : "md:w-72"
      )}
    >
      <div className={cn("mb-4 flex items-center rounded-[26px] border border-white/10 bg-white/6 px-3 py-3", sidebarCollapsed ? "justify-center" : "justify-between")}>
        {!sidebarCollapsed ? (
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#8ef7d6_0%,#ffd27f_100%)] text-slate-950 shadow-[0_12px_24px_rgba(255,210,127,0.24)]">
              <Wrench className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Serveify</p>
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">Control Room</p>
            </div>
          </Link>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#8ef7d6_0%,#ffd27f_100%)] text-slate-950">
            <Wrench className="h-4 w-4" />
          </div>
        )}

        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="rounded-2xl border border-white/10 bg-white/8 p-2 text-white/70 hover:bg-white/14 hover:text-white"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {sidebarCollapsed && (
        <button
          onClick={toggleSidebar}
          className="mb-4 mx-auto rounded-2xl border border-white/10 bg-white/8 p-2 text-white/70 hover:bg-white/14 hover:text-white"
          aria-label="Expand sidebar"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {!sidebarCollapsed && (
        <div className="mb-4 rounded-[24px] border border-cyan-200/15 bg-[linear-gradient(135deg,rgba(86,182,255,0.22),rgba(104,255,213,0.08))] px-4 py-4 text-white">
          <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/70">Active Mode</p>
          <p className="mt-2 text-lg font-semibold">{user?.activeRole ?? "CUSTOMER"}</p>
          <p className="mt-1 text-sm text-white/65">Glass surfaces stay readable with stronger contrast in the shell.</p>
        </div>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto pr-1 scrollbar-none">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={sidebarCollapsed ? item.label : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-[22px] px-3 py-3 text-sm transition-all duration-200",
                active
                  ? "bg-white/16 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]"
                  : "text-white/64 hover:bg-white/10 hover:text-white",
                sidebarCollapsed && "justify-center px-2"
              )}
            >
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10", active ? "bg-white/16" : "bg-white/6 group-hover:bg-white/10")}>
                <Icon className="h-4 w-4 shrink-0" />
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.label}</p>
                  <p className="truncate text-[11px] uppercase tracking-[0.18em] text-white/35">{item.href.replace("/", "") || "home"}</p>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className={cn("mt-4 rounded-[24px] border border-white/10 bg-white/6 p-3", sidebarCollapsed && "flex justify-center")}>
        {sidebarCollapsed ? (
          <Avatar src={user?.avatar} name={`${user?.firstName} ${user?.lastName}`} size="sm" />
        ) : (
          <div className="flex items-center gap-3">
            <Avatar src={user?.avatar} name={`${user?.firstName} ${user?.lastName}`} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user?.fullName ?? `${user?.firstName} ${user?.lastName}`}</p>
              <p className="truncate text-xs text-white/45">{user?.email}</p>
            </div>
            <button
              onClick={clearAuth}
              title="Sign out"
              className="rounded-2xl border border-white/10 bg-white/6 p-2 text-white/60 hover:bg-white/12 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
