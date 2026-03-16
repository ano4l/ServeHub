"use client";
import { useState } from "react";
import { Bell, ChevronDown, Search, SwitchCamera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";
import type { UserRole } from "@/lib/constants";
import Link from "next/link";
import { useRouter } from "next/navigation";

const rolePaths: Record<UserRole, string> = {
  CUSTOMER: "/dashboard",
  PROVIDER: "/provider",
  ADMIN:    "/admin",
  SUPPORT:  "/admin",
};

export function TopBar() {
  const { user, setActiveRole, clearAuth } = useAuthStore();
  const { notifications, unreadCount, markNotificationRead, markAllRead } = useUIStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const router = useRouter();

  const handleRoleSwitch = (role: UserRole) => {
    setActiveRole(role);
    router.push(rolePaths[role]);
    setProfileOpen(false);
  };

  return (
    <header className="h-16 border-b border-stone-200 bg-white/80 backdrop-blur-md flex items-center px-6 gap-4 sticky top-0 z-40">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="search"
            placeholder="Search bookings, providers, services..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
            className="relative p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 w-80 rounded-2xl bg-white border border-stone-200 shadow-xl shadow-stone-900/10 overflow-hidden z-50"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
                  <h3 className="font-semibold text-sm text-stone-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-stone-500 hover:text-stone-900">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-stone-50">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-stone-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.slice(0, 8).map((n) => (
                      <button
                        key={n.id}
                        onClick={() => { markNotificationRead(n.id); setNotifOpen(false); }}
                        className={`w-full text-left px-4 py-3 hover:bg-stone-50 transition-colors ${!n.read ? "bg-blue-50/40" : ""}`}
                      >
                        <div className="flex gap-3">
                          {!n.read && <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />}
                          <div className={!n.read ? "" : "pl-4"}>
                            <p className="text-sm font-medium text-stone-900">{n.title}</p>
                            <p className="text-xs text-stone-500 mt-0.5">{n.message}</p>
                            <p className="text-[10px] text-stone-400 mt-1">{formatRelativeTime(n.createdAt)}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <div className="px-4 py-2 border-t border-stone-100">
                  <Link
                    href="/dashboard/notifications"
                    onClick={() => setNotifOpen(false)}
                    className="text-xs text-stone-500 hover:text-stone-900"
                  >
                    View all notifications
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-stone-100 transition-colors"
          >
            <Avatar src={user?.avatar} name={`${user?.firstName} ${user?.lastName}`} size="sm" />
            <div className="text-left hidden md:block">
              <p className="text-sm font-medium text-stone-900 leading-none">
                {user?.firstName}
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">{user?.activeRole}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-stone-400 hidden md:block" />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 w-56 rounded-2xl bg-white border border-stone-200 shadow-xl shadow-stone-900/10 overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-stone-100">
                  <p className="font-semibold text-sm text-stone-900">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-stone-400">{user?.email}</p>
                </div>

                {/* Role switch */}
                {user && user.roles.length > 1 && (
                  <div className="px-4 py-2 border-b border-stone-100">
                    <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-1">Switch Role</p>
                    <div className="space-y-0.5">
                      {user.roles.map((role) => (
                        <button
                          key={role}
                          onClick={() => handleRoleSwitch(role)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                            role === user.activeRole
                              ? "bg-stone-900 text-white"
                              : "text-stone-600 hover:bg-stone-50"
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
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={clearAuth}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors"
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
