import QuestionCard from "../../components/QuestionCard";
import {
  db,
  questionCollection,
} from "../../models/name";
import { databases, users } from "../../models/server/config";
import { UserPrefs } from "../../store/Auth";
import { Query } from "node-appwrite";
import React from "react";
import { unstable_cache } from "next/cache";

// Cache the questions fetch for 5 minutes (ISR-like behavior)
const getLatestQuestions = unstable_cache(
  async () => {
    const questions = await databases.listDocuments(db, questionCollection, [
      Query.limit(5),
      Query.orderDesc("$createdAt"),
    ]);

    // Use stored counts instead of separate queries (optimization from Phase 2)
    const enrichedDocs = await Promise.all(
      questions.documents.map(async (ques) => {
        const author = await users.get<UserPrefs>(ques.authorId);
        return {
          ...ques,
          totalAnswers: ques.answerCount ?? 0,
          totalVotes: ques.voteCount ?? 0,
          author: {
            $id: author.$id,
            reputation: author.prefs?.reputation ?? 0,
            name: author.name,
          },
        };
      }),
    );

    return { ...questions, documents: enrichedDocs };
  },
  ["latest-questions"],
  { revalidate: 300, tags: ["questions"] } // 5 minutes cache
);

const LatestQuestions = async () => {
  const questions = await getLatestQuestions();

  return (
    <div className="space-y-6">
      {questions.documents.map((question) => (
        <QuestionCard key={question.$id} ques={question} />
      ))}
    </div>
  );
};

export default LatestQuestions;
