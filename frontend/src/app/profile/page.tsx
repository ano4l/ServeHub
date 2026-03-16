"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { LogIn, UserCircle2 } from "lucide-react";
import { AppTabs } from "@/components/navigation/AppTabs";
import { Button } from "@/components/ui/button";
import { DEMO_CUSTOMER_PROFILE_FIXTURE } from "@/lib/demo-profile-fixtures";
import { useAuthStore } from "@/store/auth.store";

export default function ProfileEntryPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!hydrated || !isAuthenticated) {
      return;
    }

    const destination =
      user?.activeRole === "PROVIDER"
        ? "/provider/settings"
        : user?.activeRole === "ADMIN" || user?.activeRole === "SUPPORT"
          ? "/admin"
          : "/dashboard/settings";

    router.replace(destination);
  }, [hydrated, isAuthenticated, router, user]);

  if (hydrated && isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white safe-area-top safe-area-bottom">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_bottom,rgba(251,191,36,0.16),transparent_24%)]" />
      <div className="relative mx-auto max-w-6xl px-4 pb-28 pt-4 sm:px-6">
        <div className="rounded-[24px] border border-white/10 bg-white/8 p-2.5 backdrop-blur-md">
          <AppTabs />
        </div>

        <div className="mt-4 rounded-[26px] border border-white/10 bg-white/8 p-5 text-center backdrop-blur-md sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-950 sm:h-16 sm:w-16">
            <UserCircle2 className="h-7 w-7 sm:h-8 sm:w-8" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">Profile</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-white/70">
            Open your signed-in profile to manage personal details, addresses, payment methods, and notification settings.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <img
              src={DEMO_CUSTOMER_PROFILE_FIXTURE.avatarUrl}
              alt="Demo Avatar"
              className="h-20 w-20 rounded-full border border-white/10"
            />
            <div className="text-lg font-semibold">{DEMO_CUSTOMER_PROFILE_FIXTURE.fullName}</div>
            <div className="text-sm text-white/70">{DEMO_CUSTOMER_PROFILE_FIXTURE.email}</div>
            <div className="text-sm text-white/70">{DEMO_CUSTOMER_PROFILE_FIXTURE.phoneNumber}</div>
          </div>
          <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap sm:justify-center">
            <Button size="lg" className="h-12 w-full sm:w-auto" onClick={() => router.push("/login")}>
              <LogIn className="h-4 w-4" />
              Sign in to open profile
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 w-full border-white/35 text-white hover:bg-white/10 hover:text-white sm:w-auto"
              onClick={() => router.push("/explore")}
            >
              Keep exploring
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
