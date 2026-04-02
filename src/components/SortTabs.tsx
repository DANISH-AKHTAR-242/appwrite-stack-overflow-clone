"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { memo, useCallback } from "react";

interface SortOption {
  value: string;
  label: string;
}

interface SortTabsProps {
  options: SortOption[];
  currentSort: string;
  className?: string;
}

const SortTabs = memo(function SortTabs({
  options,
  currentSort,
  className,
}: SortTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSort = useCallback((sort: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("sort", sort);
    newSearchParams.delete("page"); // Reset to page 1 when sorting
    router.push(`${pathname}?${newSearchParams}`);
  }, [searchParams, pathname, router]);

  return (
    <div className={cn("flex gap-1 rounded-lg bg-white/5 p-1", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => handleSort(option.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            currentSort === option.value
              ? "bg-orange-500 text-white"
              : "text-gray-400 hover:bg-white/10 hover:text-white"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
});

export default SortTabs;
