"use client";

import { cn } from "@/lib/utils";
import { IconX } from "@tabler/icons-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { memo, useCallback, useMemo } from "react";

interface TagFilterProps {
  tags: string[];
  className?: string;
}

export const TagFilter = memo(function TagFilter({ tags, className }: TagFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTag = searchParams.get("tag");

  const handleTagClick = useCallback((tag: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (activeTag === tag) {
      newSearchParams.delete("tag");
    } else {
      newSearchParams.set("tag", tag);
    }
    newSearchParams.delete("page"); // Reset to page 1
    router.push(`${pathname}?${newSearchParams}`);
  }, [searchParams, activeTag, pathname, router]);

  const clearTag = useCallback(() => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete("tag");
    newSearchParams.delete("page");
    router.push(`${pathname}?${newSearchParams}`);
  }, [searchParams, pathname, router]);

  if (tags.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-400">Popular Tags</h3>
        {activeTag && (
          <button
            onClick={clearTag}
            className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-400"
          >
            <IconX size={12} />
            Clear filter
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => handleTagClick(tag)}
            className={cn(
              "rounded-lg px-3 py-1 text-sm transition-colors",
              activeTag === tag
                ? "bg-orange-500 text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            )}
          >
            #{tag}
          </button>
        ))}
      </div>
    </div>
  );
});

interface ActiveTagBadgeProps {
  tag: string;
  onClear: () => void;
}

export const ActiveTagBadge = memo(function ActiveTagBadge({ tag, onClear }: ActiveTagBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg bg-orange-500/20 px-3 py-1 text-sm text-orange-300">
      <span>Filtered by: #{tag}</span>
      <button
        onClick={onClear}
        className="rounded-full p-0.5 hover:bg-orange-500/30"
      >
        <IconX size={14} />
      </button>
    </div>
  );
});

export default TagFilter;
