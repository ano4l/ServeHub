"use client";
import { ToastContainer } from "@/components/ui/toast";
import { AppTabs } from "@/components/navigation/AppTabs";

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {

  return (
    <div className="min-h-screen bg-[#07111f] text-white pb-24 safe-area-top safe-area-bottom">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_bottom,rgba(251,191,36,0.16),transparent_24%)]" />
      <div className="relative mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
        <div className="rounded-[24px] border border-white/10 bg-white/8 p-2.5 backdrop-blur-md">
          <AppTabs />
        </div>
        <main className="mt-6">
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
