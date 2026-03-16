"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { LogIn, UserCircle2 } from "lucide-react";
import { AppTabs } from "@/components/navigation/AppTabs";
import { Button } from "@/components/ui/button";
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(142,247,214,0.15),transparent_28%),linear-gradient(180deg,#09101a_0%,#0b1118_38%,#111827_100%)] px-4 py-4 text-white sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-3 backdrop-blur-xl">
          <AppTabs />
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-black/28 p-8 text-center backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-white text-black">
            <UserCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold">Profile is back as its own destination</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/68">
            Sign in to manage your personal details, addresses, payment methods, and notification preferences.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => router.push("/login")}>
              <LogIn className="h-4 w-4" />
              Sign in to open profile
            </Button>
            <Button
              variant="outline"
              size="lg"
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
