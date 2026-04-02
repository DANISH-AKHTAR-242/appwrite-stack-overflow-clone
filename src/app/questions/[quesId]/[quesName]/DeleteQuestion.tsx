"use client";

import { useAuthStore } from "../../../../store/Auth";
import { IconTrash } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import React from "react";

const DeleteQuestion = ({
  questionId,
  authorId,
}: {
  questionId: string;
  authorId: string;
}) => {
  const router = useRouter();
  const { user, jwt } = useAuthStore();
  const [loading, setLoading] = React.useState(false);

  const deleteQuestion = async () => {
    if (!jwt) {
      window.alert("Please log in to delete questions");
      return;
    }

    if (!confirm("Are you sure you want to delete this question?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/question", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwt}`,
        },
        body: JSON.stringify({ questionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error deleting question");
      }

      router.push("/questions");
    } catch (error: any) {
      window.alert(error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return user?.$id === authorId ? (
    <button
      className="flex h-10 w-10 items-center justify-center rounded-full border border-red-500 p-1 text-red-500 duration-200 hover:bg-red-500/10 disabled:opacity-50"
      onClick={deleteQuestion}
      title="Delete question"
      disabled={loading}
    >
      <IconTrash className="h-4 w-4" />
    </button>
  ) : null;
};

export default DeleteQuestion;
