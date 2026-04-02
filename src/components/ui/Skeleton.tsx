"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => (
  <div
    className={cn(
      "animate-pulse rounded-md bg-white/10",
      className
    )}
  />
);

export const QuestionCardSkeleton = () => (
  <div className="relative flex flex-col gap-4 overflow-hidden rounded-xl border border-white/20 bg-white/5 p-4 sm:flex-row">
    {/* Stats */}
    <div className="shrink-0 space-y-2 sm:text-right">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-20" />
    </div>
    {/* Content */}
    <div className="w-full space-y-3">
      <Skeleton className="h-6 w-3/4" />
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-5 w-16 rounded-lg" />
        <Skeleton className="h-5 w-20 rounded-lg" />
        <Skeleton className="h-5 w-14 rounded-lg" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-6 rounded-lg" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="ml-auto h-4 w-32" />
      </div>
    </div>
  </div>
);

export const QuestionListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-6">
    {Array.from({ length: count }).map((_, i) => (
      <QuestionCardSkeleton key={i} />
    ))}
  </div>
);

export const AnswerSkeleton = () => (
  <div className="flex gap-4">
    {/* Vote buttons */}
    <div className="flex shrink-0 flex-col items-center gap-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <Skeleton className="h-4 w-6" />
      <Skeleton className="h-10 w-10 rounded-full" />
    </div>
    {/* Content */}
    <div className="w-full space-y-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex items-center justify-end gap-2">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  </div>
);

export const AnswerListSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-6">
    {Array.from({ length: count }).map((_, i) => (
      <AnswerSkeleton key={i} />
    ))}
  </div>
);

export const CommentSkeleton = () => (
  <div className="flex gap-2 py-2">
    <Skeleton className="h-4 flex-1" />
    <Skeleton className="h-4 w-20" />
    <Skeleton className="h-4 w-16" />
  </div>
);

export const QuestionDetailSkeleton = () => (
  <div className="space-y-6">
    {/* Title */}
    <Skeleton className="h-8 w-3/4" />
    {/* Meta */}
    <div className="flex gap-4">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-20" />
    </div>
    <hr className="border-white/40" />
    {/* Content area */}
    <div className="flex gap-4">
      {/* Vote buttons */}
      <div className="flex shrink-0 flex-col items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-4 w-6" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      {/* Question content */}
      <div className="w-full space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-lg" />
          <Skeleton className="h-6 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  </div>
);

export const UserStatsSkeleton = () => (
  <div className="flex h-[250px] w-full flex-col gap-4 lg:flex-row">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="flex w-full flex-col items-center justify-center rounded-xl border border-white/20 bg-white/5 p-8"
      >
        <Skeleton className="mb-4 h-5 w-24" />
        <Skeleton className="h-10 w-16" />
      </div>
    ))}
  </div>
);

export default Skeleton;
