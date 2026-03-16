"use client";
import { ToastContainer } from "@/components/ui/toast";

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      <main className="mx-auto max-w-7xl p-6">
        {children}
      </main>
      <ToastContainer />
    </div>
  );
}
