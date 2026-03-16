import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserRole } from "@/lib/constants";

export interface User {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  roles: UserRole[];
  activeRole: UserRole;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  setActiveRole: (role: UserRole) => void;
  clearAuth: () => void;
}

const DEMO_USER: User = {
  id: "demo-customer-1",
  email: "demo@servehub.local",
  fullName: "Demo Customer",
  firstName: "Demo",
  lastName: "Customer",
  phone: "+27 00 000 0000",
  roles: ["CUSTOMER"],
  activeRole: "CUSTOMER",
  emailVerified: true,
  phoneVerified: true,
  createdAt: new Date().toISOString(),
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: DEMO_USER,
      accessToken: "demo-token",
      refreshToken: "demo-refresh-token",
      isAuthenticated: true,
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),
      setUser: (user) => set({ user }),
      setActiveRole: (role) =>
        set((s) => s.user ? { user: { ...s.user, activeRole: role } } : {}),
      clearAuth: () => {
        set({
          user: DEMO_USER,
          accessToken: "demo-token",
          refreshToken: "demo-refresh-token",
          isAuthenticated: true,
        });
      },
    }),
    {
      name: "auth-store",
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
);
