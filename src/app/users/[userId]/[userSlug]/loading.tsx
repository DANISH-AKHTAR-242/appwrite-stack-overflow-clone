import { Skeleton } from "../../../../components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto space-y-4 px-4 pt-32 pb-20">
      {/* Profile header skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <Skeleton className="h-40 w-40 shrink-0 rounded-xl" />
        <div className="w-full space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>

      {/* Nav + Content skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="w-40 shrink-0 space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="w-full">
          {/* Stats cards skeleton */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
