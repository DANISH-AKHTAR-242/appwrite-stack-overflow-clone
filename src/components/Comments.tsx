"use client";

import { databases } from "../models/client/config";
import { commentCollection, db } from "../models/name";
import { useAuthStore } from "../store/Auth";
import { cn } from "@/lib/utils"
import convertDateToRelativeTime from "../utils/relativeTime";
import slugify from "../utils/slugify";
import { IconTrash } from "@tabler/icons-react";
import { ID, Models } from "appwrite";
import Link from "next/link";
import React from "react";

const Comments = ({
    comments: _comments,
    type,
    typeId,
    className,
}: {
    comments: Models.DocumentList<Models.Document>;
    type: "question" | "answer";
    typeId: string;
    className?: string;
}) => {
    const [comments, setComments] = React.useState(_comments);
    const [newComment, setNewComment] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const { user, jwt } = useAuthStore();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newComment || !user || !jwt) {
            if (!user) window.alert("Please log in to comment");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/comment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${jwt}`,
                },
                body: JSON.stringify({
                    content: newComment,
                    type: type,
                    typeId: typeId,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.errors?.join(", ") || "Error creating comment");
            }

            setNewComment(() => "");
            setComments(prev => ({
                total: prev.total + 1,
                documents: [{ ...data, author: user }, ...prev.documents],
            }));
        } catch (error: any) {
            window.alert(error?.message || "Error creating comment");
        } finally {
            setLoading(false);
        }
    };

    const deleteComment = async (commentId: string) => {
        if (!jwt) {
            window.alert("Please log in to delete comments");
            return;
        }

        try {
            const response = await fetch("/api/comment", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${jwt}`,
                },
                body: JSON.stringify({ commentId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Error deleting comment");
            }

            setComments(prev => ({
                total: prev.total - 1,
                documents: prev.documents.filter(comment => comment.$id !== commentId),
            }));
        } catch (error: any) {
            window.alert(error?.message || "Error deleting comment");
        }
    };

    return (
        <div className={cn("flex flex-col gap-2 pl-4", className)}>
            {comments.documents.map(comment => (
                <React.Fragment key={comment.$id}>
                    <hr className="border-white/40" />
                    <div className="flex gap-2">
                        <p className="text-sm">
                            {comment.content} -{" "}
                            <Link
                                href={`/users/${comment.authorId}/${slugify(comment.author.name)}`}
                                className="text-orange-500 hover:text-orange-600"
                            >
                                {comment.author.name}
                            </Link>{" "}
                            <span className="opacity-60">
                                {convertDateToRelativeTime(new Date(comment.$createdAt))}
                            </span>
                        </p>
                        {user?.$id === comment.authorId ? (
                            <button
                                onClick={() => deleteComment(comment.$id)}
                                className="shrink-0 text-red-500 hover:text-red-600"
                                title="Delete comment"
                            >
                                <IconTrash className="h-4 w-4" />
                            </button>
                        ) : null}
                    </div>
                </React.Fragment>
            ))}
            <hr className="border-white/40" />
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <textarea
                    className="w-full rounded-md border border-white/20 bg-white/10 p-2 outline-none"
                    rows={1}
                    placeholder={user ? "Add a comment..." : "Log in to comment"}
                    value={newComment}
                    onChange={e => setNewComment(() => e.target.value)}
                    disabled={!user || loading}
                />
                <button 
                    className="shrink-0 rounded bg-orange-500 px-4 py-2 font-bold text-white hover:bg-orange-600 disabled:opacity-50"
                    disabled={!user || loading}
                >
                    {loading ? "..." : "Add Comment"}
                </button>
            </form>
        </div>
    );
};

export default Comments;
