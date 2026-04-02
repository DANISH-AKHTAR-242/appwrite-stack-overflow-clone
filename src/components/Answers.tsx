"use client";

import { Models } from "appwrite";
import React from "react";
import VoteButtons from "./VoteButtons";
import { useAuthStore } from "../store/Auth";
import { avatars } from "../models/client/config";
import RTE, { MarkdownPreview } from "./RTE";
import Comments from "./Comments";
import slugify from "../utils/slugify";
import Link from "next/link";
import { IconTrash } from "@tabler/icons-react";
import { NoAnswers } from "./ui/EmptyState";
import { ErrorState } from "./ui/ErrorState";

const Answers = ({
    answers: _answers,
    questionId,
}: {
    answers: Models.DocumentList<Models.Document>;
    questionId: string;
}) => {
    const [answers, setAnswers] = React.useState(_answers);
    const [newAnswer, setNewAnswer] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const { user, jwt } = useAuthStore();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        
        if (!newAnswer || !user || !jwt) {
            if (!user) setError("Please log in to answer");
            return;
        }

        if (newAnswer.trim().length < 10) {
            setError("Answer must be at least 10 characters");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/answer", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${jwt}`,
                },
                body: JSON.stringify({
                    questionId: questionId,
                    answer: newAnswer,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error?.message || 
                    result.error?.details?.join(", ") || 
                    "Error creating answer"
                );
            }

            setNewAnswer("");
            setAnswers(prev => ({
                total: prev.total + 1,
                documents: [
                    {
                        ...result.data,
                        author: user,
                        voteCount: 0,
                        comments: { documents: [], total: 0 },
                    },
                    ...prev.documents,
                ],
            }));
        } catch (err: any) {
            setError(err?.message || "Error creating answer");
        } finally {
            setLoading(false);
        }
    };

    const deleteAnswer = async (answerId: string) => {
        if (!jwt) {
            setError("Please log in to delete answers");
            return;
        }

        if (!confirm("Are you sure you want to delete this answer?")) return;

        try {
            const response = await fetch("/api/answer", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${jwt}`,
                },
                body: JSON.stringify({ answerId }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error?.message || "Error deleting answer");
            }

            setAnswers(prev => ({
                total: prev.total - 1,
                documents: prev.documents.filter(answer => answer.$id !== answerId),
            }));
        } catch (err: any) {
            setError(err?.message || "Error deleting answer");
        }
    };

    return (
        <div className="space-y-6">
            {/* Answers header */}
            <h2 className="text-xl font-semibold">
                {answers.total} Answer{answers.total !== 1 ? "s" : ""}
            </h2>

            {/* Error message */}
            {error && (
                <ErrorState
                    variant="inline"
                    message={error}
                    onRetry={() => setError(null)}
                />
            )}

            {/* Answers list */}
            {answers.documents.length > 0 ? (
                <div className="space-y-6">
                    {answers.documents.map(answer => (
                        <div 
                            key={answer.$id} 
                            className="flex gap-4 rounded-lg border border-white/10 bg-white/5 p-4"
                        >
                            {/* Vote column */}
                            <div className="flex shrink-0 flex-col items-center gap-4">
                                <VoteButtons
                                    type="answer"
                                    id={answer.$id}
                                    initialVoteCount={answer.voteCount ?? 0}
                                />
                                {user?.$id === answer.authorId && (
                                    <button
                                        className="flex h-10 w-10 items-center justify-center rounded-full border border-red-500 p-1 text-red-500 duration-200 hover:bg-red-500/10"
                                        onClick={() => deleteAnswer(answer.$id)}
                                        title="Delete answer"
                                    >
                                        <IconTrash className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            {/* Content column */}
                            <div className="min-w-0 flex-1">
                                <MarkdownPreview 
                                    className="rounded-lg bg-white/5 p-4" 
                                    source={answer.content} 
                                />
                                
                                {/* Author info */}
                                <div className="mt-4 flex items-center justify-end gap-2">
                                    <picture>
                                        <img
                                            src={avatars.getInitials(answer.author.name, 32, 32)}
                                            alt={answer.author.name}
                                            className="rounded-lg"
                                        />
                                    </picture>
                                    <div className="text-sm">
                                        <Link
                                            href={`/users/${answer.author.$id}/${slugify(answer.author.name)}`}
                                            className="text-orange-500 hover:text-orange-600"
                                        >
                                            {answer.author.name}
                                        </Link>
                                        <p className="text-gray-400">
                                            {answer.author.reputation} reputation
                                        </p>
                                    </div>
                                </div>

                                {/* Comments */}
                                <Comments
                                    comments={answer.comments}
                                    className="mt-4"
                                    type="answer"
                                    typeId={answer.$id}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <NoAnswers />
            )}

            {/* Answer form */}
            <div className="rounded-lg border border-white/10 bg-white/5 p-6">
                <h3 className="mb-4 text-lg font-semibold">Your Answer</h3>
                {user ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <RTE 
                            value={newAnswer} 
                            onChange={value => setNewAnswer(value || "")} 
                        />
                        <button 
                            className="rounded-lg bg-orange-500 px-6 py-2 font-medium text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={loading || !newAnswer.trim()}
                        >
                            {loading ? "Posting..." : "Post Your Answer"}
                        </button>
                    </form>
                ) : (
                    <p className="text-gray-400">
                        Please{" "}
                        <Link href="/login" className="text-orange-500 hover:text-orange-600">
                            log in
                        </Link>{" "}
                        to post an answer.
                    </p>
                )}
            </div>
        </div>
    );
};

export default Answers;
