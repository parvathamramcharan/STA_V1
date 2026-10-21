"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthTokenRefresher({ active }) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;

    let refreshInProgress = false;
    const refresh = async () => {
      if (refreshInProgress || document.visibilityState === "hidden") return;
      refreshInProgress = true;
      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          cache: "no-store",
        });
        if (response.status === 401) {
          router.replace("/");
          router.refresh();
        } else if (!response.ok) {
          console.error(`Token refresh failed with status ${response.status}`);
        }
      } catch (error) {
        console.error("Could not refresh the session:", error);
      } finally {
        refreshInProgress = false;
      }
    };

    const intervalId = setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [active, router]);

  return null;
}
