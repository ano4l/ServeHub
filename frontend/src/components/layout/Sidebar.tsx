"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, CalendarCheck, MessageSquare, Wallet, Star,
  Settings, ShieldCheck, Users, BarChart3, AlertTriangle,
  ChevronLeft, ChevronRight, Wrench, FileText, Bell, LogOut, Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const customerNav = [
  { href: "/dashboard",           label: "Dashboard",   icon: LayoutDashboard },
  { href: "/dashboard/bookings",  label: "Bookings",    icon: CalendarCheck },
  { href: "/dashboard/messages",  label: "Messages",    icon: MessageSquare },
  { href: "/dashboard/reviews",   label: "Reviews",     icon: Star },
  { href: "/dashboard/settings",  label: "Settings",    icon: Settings },
];

const providerNav = [
  { href: "/provider",                  label: "Dashboard",   icon: LayoutDashboard },
  { href: "/provider/bookings",         label: "Bookings",    icon: CalendarCheck },
  { href: "/provider/messages",         label: "Messages",    icon: MessageSquare },
  { href: "/provider/services",         label: "Services",    icon: Wrench },
  { href: "/provider/wallet",           label: "Wallet",      icon: Wallet },
  { href: "/provider/reviews",          label: "Reviews",     icon: Star },
  { href: "/provider/settings",         label: "Settings",    icon: Settings },
];

const adminNav = [
  { href: "/admin",                     label: "Overview",    icon: LayoutDashboard },
  { href: "/admin/users",               label: "Users",       icon: Users },
  { href: "/admin/verifications",       label: "Verifications",icon: ShieldCheck },
  { href: "/admin/bookings",            label: "Bookings",    icon: CalendarCheck },
  { href: "/admin/disputes",            label: "Disputes",    icon: AlertTriangle },
  { href: "/admin/reviews",             label: "Reviews",     icon: Star },
  { href: "/admin/categories",          label: "Catalog",     icon: Layers },
  { href: "/admin/analytics",           label: "Analytics",   icon: BarChart3 },
  { href: "/admin/audit-logs",          label: "Audit Logs",  icon: FileText },
  { href: "/admin/notifications",       label: "Notifications",icon: Bell },
  { href: "/admin/settings",            label: "Settings",    icon: Settings },
];

function getNav(role?: string) {
  switch (role) {
    case "ADMIN":   return adminNav;
    case "PROVIDER": return providerNav;
    default:         return customerNav;
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
        "flex flex-col h-full bg-stone-950 text-white transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center h-16 px-4 border-b border-white/10",
        sidebarCollapsed ? "justify-center" : "justify-between"
      )}>
        {!sidebarCollapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-lime-400 flex items-center justify-center">
              <Wrench className="h-4 w-4 text-stone-900" />
            </div>
            <span className="font-bold text-sm tracking-tight">Serveify</span>
          </Link>
        )}
        {sidebarCollapsed && (
          <div className="h-7 w-7 rounded-lg bg-lime-400 flex items-center justify-center">
            <Wrench className="h-4 w-4 text-stone-900" />
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            "text-white/40 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10",
            sidebarCollapsed && "hidden"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Expand button when collapsed */}
      {sidebarCollapsed && (
        <button
          onClick={toggleSidebar}
          className="mx-auto mt-2 text-white/40 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto scrollbar-none">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm transition-all duration-150",
                active
                  ? "bg-white/15 text-white font-medium"
                  : "text-white/60 hover:text-white hover:bg-white/8",
                sidebarCollapsed && "justify-center px-2"
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon className={cn("shrink-0", active ? "h-4.5 w-4.5" : "h-4 w-4")} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className={cn(
        "p-3 border-t border-white/10",
        sidebarCollapsed && "flex justify-center"
      )}>
        {sidebarCollapsed ? (
          <Avatar src={user?.avatar} name={`${user?.firstName} ${user?.lastName}`} size="sm" />
        ) : (
          <div className="flex items-center gap-3">
            <Avatar src={user?.avatar} name={`${user?.firstName} ${user?.lastName}`} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-white/40 truncate">{user?.activeRole}</p>
            </div>
            <button
              onClick={clearAuth}
              className="text-white/30 hover:text-white transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
