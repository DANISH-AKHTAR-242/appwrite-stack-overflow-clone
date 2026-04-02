"use client";

import { cn } from "@/lib/utils";
import { IconAlertTriangle, IconRefresh, IconWifiOff } from "@tabler/icons-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  variant?: "default" | "inline" | "toast";
  className?: string;
}

export const ErrorState = ({
  title = "Something went wrong",
  message = "An error occurred while loading this content. Please try again.",
  onRetry,
  variant = "default",
  className,
}: ErrorStateProps) => {
  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm",
          className
        )}
      >
        <IconAlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
        <span className="text-red-200">{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-auto shrink-0 text-red-400 hover:text-red-300"
          >
            <IconRefresh className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 px-6 py-12 text-center",
        className
      )}
    >
      <div className="mb-4 rounded-full bg-red-500/10 p-3">
        <IconAlertTriangle className="h-8 w-8 text-red-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-200">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-gray-400">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 flex items-center gap-2 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-500/30"
        >
          <IconRefresh className="h-4 w-4" />
          Try Again
        </button>
      )}
    </div>
  );
};

export const NetworkError = ({ onRetry }: { onRetry?: () => void }) => (
  <ErrorState
    title="Connection Error"
    message="Unable to connect to the server. Please check your internet connection."
    onRetry={onRetry}
  />
);

export const NotFoundError = ({ entity = "Page" }: { entity?: string }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="mb-4 text-6xl font-bold text-gray-600">404</div>
    <h3 className="text-lg font-medium text-gray-200">{entity} Not Found</h3>
    <p className="mt-2 text-sm text-gray-400">
      The {entity.toLowerCase()} you're looking for doesn't exist or has been removed.
    </p>
  </div>
);

export const ApiError = ({
  error,
  onRetry,
}: {
  error: { code?: string; message?: string };
  onRetry?: () => void;
}) => {
  const errorMessages: Record<string, string> = {
    UNAUTHORIZED: "Please log in to continue.",
    FORBIDDEN: "You don't have permission to perform this action.",
    NOT_FOUND: "The requested resource was not found.",
    RATE_LIMITED: "Too many requests. Please wait a moment and try again.",
    VALIDATION_ERROR: "Please check your input and try again.",
  };

  const message = error.code
    ? errorMessages[error.code] || error.message
    : error.message || "An unexpected error occurred.";

  return <ErrorState message={message} onRetry={onRetry} />;
};

export default ErrorState;
