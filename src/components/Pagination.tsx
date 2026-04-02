"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { memo, useCallback, useMemo } from "react";

interface PaginationProps {
    className?: string;
    limit: number;
    total: number;
}

const Pagination = memo(function Pagination({
    className,
    total,
    limit,
}: PaginationProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // Parse page as number to fix string comparison bugs
    const page = useMemo(() => {
        const pageParam = searchParams.get("page");
        const parsed = parseInt(pageParam || "1", 10);
        return isNaN(parsed) || parsed < 1 ? 1 : parsed;
    }, [searchParams]);

    const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

    const navigate = useCallback((newPage: number) => {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set("page", String(newPage));
        router.push(`${pathname}?${newSearchParams}`);
    }, [searchParams, pathname, router]);

    const prev = useCallback(() => {
        if (page > 1) navigate(page - 1);
    }, [page, navigate]);

    const next = useCallback(() => {
        if (page < totalPages) navigate(page + 1);
    }, [page, totalPages, navigate]);

    return (
        <div className="flex items-center justify-center gap-4">
            <button
                className={`${className || ""} rounded-lg bg-white/10 px-4 py-1.5 duration-200 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50`}
                onClick={prev}
                disabled={page <= 1}
            >
                Previous
            </button>
            <span className="text-sm text-gray-400">
                Page {page} of {totalPages}
            </span>
            <button
                className={`${className || ""} rounded-lg bg-white/10 px-4 py-1.5 duration-200 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50`}
                onClick={next}
                disabled={page >= totalPages}
            >
                Next
            </button>
        </div>
    );
});

export default Pagination;
