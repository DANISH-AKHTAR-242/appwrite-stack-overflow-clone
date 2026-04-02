"use client";

import { cn } from "@/lib/utils";
import { IconMoodEmpty, IconMessageQuestion, IconMessage, IconSearch } from "@tabler/icons-react";
import Link from "next/link";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 py-12 text-center",
      className
    )}
  >
    {icon && (
      <div className="mb-4 text-gray-400">
        {icon}
      </div>
    )}
    <h3 className="text-lg font-medium text-gray-200">{title}</h3>
    {description && (
      <p className="mt-2 max-w-sm text-sm text-gray-400">{description}</p>
    )}
    {action && (
      action.href ? (
        <Link
          href={action.href}
          className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          {action.label}
        </Link>
      ) : (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          {action.label}
        </button>
      )
    )}
  </div>
);

export const NoQuestions = ({ hasSearch = false }: { hasSearch?: boolean }) => (
  <EmptyState
    icon={hasSearch ? <IconSearch size={48} /> : <IconMessageQuestion size={48} />}
    title={hasSearch ? "No questions found" : "No questions yet"}
    description={
      hasSearch
        ? "Try adjusting your search or filter to find what you're looking for."
        : "Be the first to ask a question and start the conversation!"
    }
    action={
      hasSearch
        ? undefined
        : { label: "Ask a Question", href: "/questions/ask" }
    }
  />
);

export const NoAnswers = () => (
  <EmptyState
    icon={<IconMessage size={48} />}
    title="No answers yet"
    description="Be the first to help! Share your knowledge and answer this question."
  />
);

export const NoComments = () => (
  <div className="py-2 text-center text-sm text-gray-400">
    No comments yet
  </div>
);

export const NoResults = ({ entity = "items" }: { entity?: string }) => (
  <EmptyState
    icon={<IconMoodEmpty size={48} />}
    title={`No ${entity} found`}
    description="Try adjusting your filters or search criteria."
  />
);

export default EmptyState;
