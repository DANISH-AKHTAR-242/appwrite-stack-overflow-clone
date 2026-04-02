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
    console.error("Question detail error:", error);
  }, [error]);

  const isNotFound = error.message?.includes("not found") || 
                     error.message?.includes("404") ||
                     error.message?.includes("Document with the requested ID");

  return (
    <div className="container mx-auto px-4 pt-36 pb-20">
      <div className="mx-auto max-w-2xl">
        {isNotFound ? (
          <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-center">
            <h1 className="mb-2 text-2xl font-bold">Question Not Found</h1>
            <p className="mb-6 text-gray-400">
              This question may have been deleted or never existed.
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
            title="Failed to load question"
            message={error.message || "Something went wrong while loading this question."}
            onRetry={reset}
          />
        )}
      </div>
    </div>
  );
}
