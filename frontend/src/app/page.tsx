"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import BrowsePage from "./browse/page";
import { useAuthStore } from "@/store/auth.store";

export default function HomePage() {
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
        ? "/provider"
        : user?.activeRole === "ADMIN" || user?.activeRole === "SUPPORT"
          ? "/admin"
          : "/dashboard";

    router.replace(destination);
  }, [hydrated, isAuthenticated, router, user]);

  if (hydrated && isAuthenticated) {
    return null;
  }

  return <BrowsePage />;
}
