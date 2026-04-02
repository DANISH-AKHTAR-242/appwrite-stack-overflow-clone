"use client";

import { useEffect } from "react";
import { ErrorState } from "../../../../components/ui/ErrorState";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("User profile error:", error);
  }, [error]);

  const isNotFound = error.message?.includes("not found") || 
                     error.message?.includes("404") ||
                     error.message?.includes("User with the requested ID");

  return (
    <div className="container mx-auto px-4 pt-32 pb-20">
      <div className="mx-auto max-w-2xl">
        {isNotFound ? (
          <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-center">
            <h1 className="mb-2 text-2xl font-bold">User Not Found</h1>
            <p className="mb-6 text-gray-400">
              This user profile does not exist or has been removed.
            </p>
            <Link
              href="/questions"
              className="inline-flex items-center rounded-lg bg-orange-500 px-6 py-2 font-medium text-white transition-colors hover:bg-orange-600"
            >
              Browse Questions
            </Link>
          </div>
        ) : (
          <ErrorState
            title="Failed to load profile"
            message={error.message || "Something went wrong while loading this profile."}
            onRetry={reset}
          />
        )}
      </div>
    </div>
  );
}
