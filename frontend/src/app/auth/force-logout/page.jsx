"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ForceLogoutPage() {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/auth/logout", { method: "POST", cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          const result = await response.json().catch(() => null);
          throw new Error(
            result?.error || `Logout failed with status ${response.status}`,
          );
        }
        try {
          localStorage.removeItem("ipSearchHistory");
        } catch (storageError) {
          console.error("Could not clear saved IP search history:", storageError);
        }
        router.replace("/");
        router.refresh();
      })
      .catch((logoutError) => {
        console.error("Could not revoke the authentication tokens:", logoutError);
        if (active) {
          setError(
            logoutError instanceof Error
              ? logoutError.message
              : "Could not revoke the current session. Please retry.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [attempt, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md px-6 text-center">
        <p className="text-sm">
          {error
            ? "Your session could not be revoked."
            : "Your session has expired. Redirecting to login..."}
        </p>
        {error && (
          <>
            <p className="mt-3 text-sm text-red-600" role="alert">
              {error}
            </p>
            <button
              className="mt-5 rounded-md bg-blue-600 px-4 py-2 text-white"
              onClick={() => {
                setError("");
                setAttempt((value) => value + 1);
              }}
            >
              Retry logout
            </button>
          </>
        )}
      </div>
    </div>
  );
}
