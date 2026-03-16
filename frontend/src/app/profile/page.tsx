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
    <div className="min-h-screen bg-[#080808] text-white px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-3 backdrop-blur-xl">
          <AppTabs />
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-black/28 p-8 text-center backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-white text-black">
            <UserCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold">Demo Profile</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/84">
            In demo mode, you can view sample profile info, addresses, payment methods, and notification preferences. All actions are simulated.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Demo Avatar" className="h-20 w-20 rounded-full border border-white/10" />
            <div className="text-lg font-semibold">John Doe</div>
            <div className="text-sm text-white/70">johndoe@email.com</div>
            <div className="text-sm text-white/70">+1 (555) 123-4567</div>
          </div>
        </div>
      </div>
    </div>
  );
}
