"use client";

import QuestionForm from "@/components/QuestionForm";
import { useAuthStore } from "@/store/Auth";
import slugify from "@/utils/slugify";
import { Models } from "appwrite";
import { useRouter } from "next/navigation";
import React from "react";

const EditQues = ({ question }: { question: Models.Document }) => {
  const { user } = useAuthStore();
  const router = useRouter();

  React.useEffect(() => {
    if (question.authorId !== user?.$id) {
      router.push(`/questions/${question.$id}/${slugify(question.title)}`);
    }
  }, []);

  if (user?.$id !== question.authorId) return null;

  return (
    <div className="block pt-32 pb-20">
      <div className="container mx-auto px-4">
        <h1 className="mt-4 mb-10 text-2xl">Edit your public question</h1>

        <div className="flex flex-wrap md:flex-row-reverse">
          <div className="w-full md:w-1/3"></div>
          <div className="w-full md:w-2/3">
            <QuestionForm question={question} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditQues;
