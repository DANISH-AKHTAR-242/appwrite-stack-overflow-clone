import { QuestionListSkeleton } from "../../components/ui/Skeleton";
import { Skeleton } from "../../components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 pt-36 pb-20">
      {/* Header */}
      <div className="mb-10 flex items-center justify-between">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-12 w-40" />
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-80" />
      </div>

      {/* Tags */}
      <div className="mb-6 flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20" />
        ))}
      </div>

      {/* Count */}
      <div className="mb-4">
        <Skeleton className="h-5 w-32" />
      </div>

      {/* Questions list */}
      <QuestionListSkeleton count={5} />
    </div>
  );
}
