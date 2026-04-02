"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "./ui/Skeleton";

// Lazy load the markdown editor (heavy bundle)
const RTE = dynamic(
    () => import("@uiw/react-md-editor").then(mod => mod.default),
    { 
        ssr: false,
        loading: () => <Skeleton className="h-48 w-full rounded-lg" />
    }
);

// Lazy load markdown preview for read-only display
export const MarkdownPreview = dynamic(
    () => import("@uiw/react-md-editor").then(mod => mod.default.Markdown),
    { 
        ssr: false,
        loading: () => <Skeleton className="h-24 w-full rounded-lg" />
    }
);

export default RTE;
