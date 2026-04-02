"use client";

import { databases } from "../models/client/config";
import { db, voteCollection } from "../models/name";
import { useAuthStore } from "../store/Auth";
import { cn } from "@/lib/utils";
import { IconCaretUpFilled, IconCaretDownFilled } from "@tabler/icons-react";
import { Models, Query } from "appwrite";
import { useRouter } from "next/navigation";
import React, { memo, useCallback, useState, useEffect } from "react";

interface VoteButtonsProps {
    type: "question" | "answer";
    id: string;
    initialVoteCount?: number;
    className?: string;
}

const VoteButtons = memo(function VoteButtons({
    type,
    id,
    initialVoteCount = 0,
    className,
}: VoteButtonsProps) {
    const [votedDocument, setVotedDocument] = useState<Models.Document | null>(); // undefined means not fetched yet
    const [voteCount, setVoteCount] = useState<number>(initialVoteCount);
    const [loading, setLoading] = useState(false);

    const { user, jwt } = useAuthStore();
    const router = useRouter();

    // Fetch user's existing vote
    useEffect(() => {
        let cancelled = false;
        
        (async () => {
            if (user) {
                const response = await databases.listDocuments(db, voteCollection, [
                    Query.equal("type", type),
                    Query.equal("typeId", id),
                    Query.equal("votedById", user.$id),
                ]);
                if (!cancelled) {
                    setVotedDocument(response.documents[0] || null);
                }
            } else {
                if (!cancelled) setVotedDocument(null);
            }
        })();
        
        return () => { cancelled = true; };
    }, [user, id, type]);

    const vote = useCallback(async (voteStatus: "upvoted" | "downvoted") => {
        if (!user) return router.push("/login");
        if (!jwt) {
            window.alert("Session expired. Please log in again.");
            return;
        }
        if (votedDocument === undefined || loading) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/vote`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${jwt}`,
                },
                body: JSON.stringify({
                    voteStatus,
                    type,
                    typeId: id,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error?.message || "Error voting");
            }

            // Update state with new values from API
            setVoteCount(result.data.voteCount);
            setVotedDocument(result.data.vote);
        } catch (error: any) {
            window.alert(error?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    }, [user, jwt, router, votedDocument, loading, type, id]);

    const handleUpvote = useCallback(() => vote("upvoted"), [vote]);
    const handleDownvote = useCallback(() => vote("downvoted"), [vote]);

    return (
        <div className={cn("flex shrink-0 flex-col items-center justify-start gap-y-4", className)}>
            <button
                title="Upvote"
                className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border p-1 duration-200 hover:bg-white/10 disabled:opacity-50",
                    votedDocument && votedDocument.voteStatus === "upvoted"
                        ? "border-orange-500 text-orange-500"
                        : "border-white/30"
                )}
                onClick={handleUpvote}
                disabled={loading}
            >
                <IconCaretUpFilled />
            </button>
            <span>{voteCount}</span>
            <button
                title="Downvote"
                className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border p-1 duration-200 hover:bg-white/10 disabled:opacity-50",
                    votedDocument && votedDocument.voteStatus === "downvoted"
                        ? "border-orange-500 text-orange-500"
                        : "border-white/30"
                )}
                onClick={handleDownvote}
                disabled={loading}
            >
                <IconCaretDownFilled />
            </button>
        </div>
    );
});

export default VoteButtons;
