"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { ToastContainer } from "@/components/ui/toast";
import { useAuthStore } from "@/store/auth.store";

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (requiredRole && user?.activeRole !== requiredRole) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, requiredRole, router, user]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-transparent">
      <div className="page-orb left-[-8rem] top-[-5rem] h-72 w-72 bg-cyan-300/55" />
      <div className="page-orb right-[10%] top-[4rem] h-60 w-60 bg-amber-200/60 [animation-delay:2s]" />
      <div className="page-orb bottom-[-4rem] right-[-2rem] h-80 w-80 bg-emerald-200/45 [animation-delay:4s]" />

      <Sidebar />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden px-3 pb-3 pt-3 md:px-4">
        <TopBar />
        <main className="relative mt-3 flex-1 overflow-y-auto rounded-[32px] liquid-panel glass-hairline surface-ring px-4 py-4 md:px-6 md:py-6">
          {children}
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
