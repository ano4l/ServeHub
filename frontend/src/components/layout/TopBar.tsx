"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, ChevronDown, Search, SwitchCamera } from "lucide-react";
import type { UserRole } from "@/lib/constants";
import { Avatar } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";

const rolePaths: Record<UserRole, string> = {
  CUSTOMER: "/",
  PROVIDER: "/provider",
  ADMIN: "/admin",
  SUPPORT: "/admin",
};

export function TopBar() {
  const { user, setActiveRole, clearAuth } = useAuthStore();
  const { notifications, unreadCount, markAllRead, markNotificationRead } = useUIStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const router = useRouter();

  const handleRoleSwitch = (role: UserRole) => {
    setActiveRole(role);
    router.push(rolePaths[role]);
    setProfileOpen(false);
  };

  return (
    <header className="liquid-panel-strong glass-hairline surface-ring sticky top-0 z-40 flex h-18 items-center gap-4 rounded-[30px] border border-white/70 px-4 py-3 md:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="hidden rounded-full border border-sky-200/60 bg-sky-100/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-900 md:inline-flex">
          Live workspace
        </div>
        <div className="relative min-w-0 flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search bookings, providers, services..."
            className="w-full rounded-full border border-white/70 bg-white/68 py-3 pl-10 pr-4 text-sm text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] focus:bg-white/92 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen((open) => !open);
              setProfileOpen(false);
            }}
            className="relative rounded-2xl border border-white/65 bg-white/56 p-2.5 text-slate-600 hover:bg-white/82 hover:text-slate-900"
            aria-label="Open notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff8a7a_0%,#ff5876_100%)] px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.97 }}
                transition={{ duration: 0.16 }}
                className="liquid-panel-strong absolute right-0 top-14 z-50 w-84 overflow-hidden rounded-[28px] border border-white/70"
              >
                <div className="flex items-center justify-between border-b border-slate-200/35 px-4 py-3">
                  <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs font-medium text-slate-500 hover:text-slate-900">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-10 text-center text-sm text-slate-500">No notifications yet</div>
                  ) : (
                    notifications.slice(0, 8).map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => {
                          markNotificationRead(notification.id);
                          setNotifOpen(false);
                        }}
                        className="w-full border-b border-white/50 px-4 py-3 text-left last:border-b-0 hover:bg-white/40"
                      >
                        <div className="flex gap-3">
                          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.read ? "bg-slate-300" : "bg-sky-500"}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900">{notification.title}</p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">{notification.message}</p>
                            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-slate-400">{formatRelativeTime(notification.createdAt)}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <div className="border-t border-slate-200/35 px-4 py-3">
                  <Link href="/dashboard/notifications" onClick={() => setNotifOpen(false)} className="text-xs font-medium text-slate-500 hover:text-slate-900">
                    View all notifications
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen((open) => !open);
              setNotifOpen(false);
            }}
            className="flex items-center gap-3 rounded-[22px] border border-white/65 bg-white/56 p-1.5 pr-3 hover:bg-white/82"
          >
            <Avatar src={user?.avatar} name={`${user?.firstName} ${user?.lastName}`} size="sm" />
            <div className="hidden text-left md:block">
              <p className="text-sm font-semibold leading-none text-slate-900">{user?.firstName}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-slate-400">{user?.activeRole}</p>
            </div>
            <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 md:block" />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.97 }}
                transition={{ duration: 0.16 }}
                className="liquid-panel-strong absolute right-0 top-14 z-50 w-64 overflow-hidden rounded-[28px] border border-white/70"
              >
                <div className="border-b border-slate-200/35 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-900">{user?.fullName ?? `${user?.firstName} ${user?.lastName}`}</p>
                  <p className="mt-1 text-xs text-slate-500">{user?.email}</p>
                </div>

                {user && user.roles.length > 1 && (
                  <div className="border-b border-slate-200/35 px-4 py-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Switch role</p>
                    <div className="space-y-1">
                      {user.roles.map((role) => (
                        <button
                          key={role}
                          onClick={() => handleRoleSwitch(role)}
                          className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm ${
                            role === user.activeRole ? "bg-slate-900 text-white" : "bg-white/42 text-slate-700 hover:bg-white/72"
                          }`}
                        >
                          <SwitchCamera className="h-3.5 w-3.5" />
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-2">
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm text-slate-700 hover:bg-white/56"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={clearAuth}
                    className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm text-rose-600 hover:bg-rose-50/70"
                  >
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
