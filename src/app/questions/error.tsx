"use client";

import { useEffect } from "react";
import { ErrorState } from "../../components/ui/ErrorState";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error("Questions page error:", error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 pt-36 pb-20">
      <ErrorState
        title="Failed to load questions"
        message={error.message || "Something went wrong while loading questions."}
        onRetry={reset}
      />
    </div>
  );
}
