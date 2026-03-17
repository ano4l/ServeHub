"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserCircle2,
  MapPin,
  CreditCard,
  Bell,
  Shield,
  ChevronRight,
  Star,
  CalendarCheck2,
  Wallet,
  Settings,
  HelpCircle,
  LogOut,
  Moon,
  Globe,
  Heart,
  Edit3,
  Camera,
} from "lucide-react";
import { AppTabs } from "@/components/navigation/AppTabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProfileUser {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  city: string;
  memberSince: string;
  totalBookings: number;
  avgRating: number;
  totalSpent: string;
  savedProviders: number;
}

const DEMO_USER: ProfileUser = {
  name: "Sarah Johnson",
  email: "sarah.johnson@email.com",
  phone: "+27 83 123 4567",
  avatar: "",
  city: "Sandton, Johannesburg",
  memberSince: "January 2024",
  totalBookings: 24,
  avgRating: 4.8,
  totalSpent: "R12,450",
  savedProviders: 8,
};

const SAVED_ADDRESSES = [
  { id: "1", label: "Home", address: "83 Rivonia Road, Sandton, 2196", isDefault: true },
  { id: "2", label: "Office", address: "15 Tyrwhitt Avenue, Rosebank, 2196", isDefault: false },
  { id: "3", label: "Mom's place", address: "22 Jan Smuts Ave, Parktown, 2193", isDefault: false },
];

const PAYMENT_METHODS = [
  { id: "1", type: "card", label: "Visa ending 4289", isDefault: true },
  { id: "2", type: "card", label: "Mastercard ending 7731", isDefault: false },
  { id: "3", type: "eft", label: "Instant EFT", isDefault: false },
];

interface SettingsItem {
  icon: typeof UserCircle2;
  label: string;
  description: string;
  action: string;
  badge?: string;
}

const SETTINGS_SECTIONS: { title: string; items: SettingsItem[] }[] = [
  {
    title: "Preferences",
    items: [
      { icon: Bell, label: "Notifications", description: "Push, email & SMS settings", action: "notifications" },
      { icon: Moon, label: "Appearance", description: "Dark mode (active)", action: "appearance", badge: "Dark" },
      { icon: Globe, label: "Language", description: "English (South Africa)", action: "language" },
    ],
  },
  {
    title: "Account",
    items: [
      { icon: Shield, label: "Privacy & Security", description: "Password, 2FA, data", action: "security" },
      { icon: HelpCircle, label: "Help & Support", description: "FAQ, contact support", action: "help" },
      { icon: Settings, label: "App Settings", description: "Cache, defaults, debug", action: "settings" },
    ],
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#07111f] text-white safe-area-top safe-area-bottom">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_bottom,rgba(251,191,36,0.16),transparent_24%)]" />
      <AppTabs />
      <div className="relative mx-auto max-w-3xl px-4 pb-24 pt-4 sm:px-6">
        {/* Header */}
        <div className="mt-2">
          <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/55">Profile</p>
        </div>

        {/* Profile card */}
        <div className="mt-4 rounded-[24px] border border-white/10 bg-white/8 p-5 backdrop-blur-md">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="flex h-18 w-18 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-2xl font-bold sm:h-20 sm:w-20">
                {DEMO_USER.name.charAt(0)}
              </div>
              <button className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-950 shadow-lg active:scale-95">
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold truncate">{DEMO_USER.name}</h1>
                <button className="text-white/40 hover:text-white/70">
                  <Edit3 className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-white/55">{DEMO_USER.email}</p>
              <p className="text-sm text-white/45">{DEMO_USER.phone}</p>
              <div className="mt-2 flex items-center gap-1 text-xs text-white/40">
                <MapPin className="h-3 w-3" />
                {DEMO_USER.city}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-5 grid grid-cols-4 gap-3">
            {[
              { label: "Bookings", value: `${DEMO_USER.totalBookings}`, icon: CalendarCheck2 },
              { label: "Rating", value: `${DEMO_USER.avgRating}`, icon: Star },
              { label: "Spent", value: DEMO_USER.totalSpent, icon: Wallet },
              { label: "Saved", value: `${DEMO_USER.savedProviders}`, icon: Heart },
            ].map((stat) => (
              <div key={stat.label} className="rounded-[16px] bg-white/5 p-3 text-center">
                <stat.icon className="mx-auto h-4 w-4 text-cyan-300/70" />
                <p className="mt-1.5 text-base font-semibold">{stat.value}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-white/35 text-center">
            Member since {DEMO_USER.memberSince}
          </p>
        </div>

        {/* Saved addresses */}
        <div className="mt-6 rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-cyan-300" />
              <p className="text-sm font-semibold">Saved addresses</p>
            </div>
            <button className="text-xs text-cyan-200 hover:text-cyan-100">+ Add new</button>
          </div>
          <div className="space-y-2">
            {SAVED_ADDRESSES.map((addr) => (
              <div
                key={addr.id}
                className="flex items-center justify-between rounded-[16px] bg-white/5 p-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{addr.label}</span>
                    {addr.isDefault && (
                      <Badge className="rounded-full bg-cyan-400/15 text-cyan-200 text-[10px] border-cyan-400/20">
                        Default
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-white/45 mt-0.5 truncate">{addr.address}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-white/30 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Payment methods */}
        <div className="mt-4 rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-cyan-300" />
              <p className="text-sm font-semibold">Payment methods</p>
            </div>
            <button className="text-xs text-cyan-200 hover:text-cyan-100">+ Add new</button>
          </div>
          <div className="space-y-2">
            {PAYMENT_METHODS.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between rounded-[16px] bg-white/5 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                    <CreditCard className="h-4 w-4 text-white/70" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{method.label}</span>
                      {method.isDefault && (
                        <Badge className="rounded-full bg-cyan-400/15 text-cyan-200 text-[10px] border-cyan-400/20">
                          Default
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-white/30" />
              </div>
            ))}
          </div>
        </div>

        {/* Settings sections */}
        {SETTINGS_SECTIONS.map((section) => (
          <div
            key={section.title}
            className="mt-4 rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-md"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-white/35 mb-3">{section.title}</p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.action}
                    className="flex w-full items-center justify-between rounded-[16px] bg-white/0 p-3 text-left transition-colors hover:bg-white/5 active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/8">
                        <Icon className="h-4 w-4 text-white/70" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-white/40">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <Badge className="rounded-full bg-white/8 text-white/60 text-[10px] border-white/10">
                          {item.badge}
                        </Badge>
                      )}
                      <ChevronRight className="h-4 w-4 text-white/30" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Sign out */}
        <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-[20px] border border-red-400/20 bg-red-400/8 p-4 text-red-300 transition-colors hover:bg-red-400/12 active:scale-[0.98]">
          <LogOut className="h-4 w-4" />
          <span className="text-sm font-medium">Sign out</span>
        </button>

        <p className="mt-4 text-center text-xs text-white/25">ServeHub v1.0.0 · South Africa</p>
      </div>
    </div>
  );
}
