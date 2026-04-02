import Answers from "../../../../components/Answers";
import Comments from "../../../../components/Comments";
import { MarkdownPreview } from "../../../../components/RTE";
import VoteButtons from "../../../../components/VoteButtons";
import Particles from "../../../../components/magicui/particles";
import ShimmerButton from "../../../../components/magicui/shimmer-button";
import { avatars } from "../../../../models/client/config";
import {
  answerCollection,
  db,
  questionCollection,
  commentCollection,
  questionAttachmentBucket,
} from "../../../../models/name";
import { databases, users } from "../../../../models/server/config";
import { storage } from "../../../../models/client/config";
import { UserPrefs } from "../../../../store/Auth";
import convertDateToRelativeTime from "../../../../utils/relativeTime";
import slugify from "../../../../utils/slugify";
import Link from "next/link";
import { Query } from "node-appwrite";
import React from "react";
import DeleteQuestion from "./DeleteQuestion";
import EditQuestion from "./EditQuestion";
import { TracingBeam } from "../../../../components/ui/tracing-beam";
import { unstable_cache } from "next/cache";

// Cache user lookups to avoid N+1 queries
const getCachedUser = unstable_cache(
  async (userId: string) => {
    const user = await users.get<UserPrefs>(userId);
    return {
      $id: user.$id,
      name: user.name,
      reputation: user.prefs?.reputation || 0,
    };
  },
  ["user"],
  { revalidate: 600 } // Cache users for 10 minutes
);

// Batch fetch all unique users for a question page
async function batchFetchUsers(authorIds: string[]) {
  const uniqueIds = [...new Set(authorIds)];
  const usersMap = new Map();
  await Promise.all(
    uniqueIds.map(async (id) => {
      const user = await getCachedUser(id);
      usersMap.set(id, user);
    })
  );
  return usersMap;
}

const Page = async ({
  params,
}: {
  params: Promise<{ quesId: string; quesName: string }>;
}) => {
  const { quesId } = await params;
  
  // Initial parallel fetch
  const [question, answers, questionComments] = await Promise.all([
    databases.getDocument(db, questionCollection, quesId),
    databases.listDocuments(db, answerCollection, [
      Query.orderDesc("$createdAt"),
      Query.equal("questionId", quesId),
    ]),
    databases.listDocuments(db, commentCollection, [
      Query.equal("type", "question"),
      Query.equal("typeId", quesId),
      Query.orderDesc("$createdAt"),
    ]),
  ]);

  // Fetch comments for all answers in parallel
  const answerCommentsList = await Promise.all(
    answers.documents.map(answer =>
      databases.listDocuments(db, commentCollection, [
        Query.equal("typeId", answer.$id),
        Query.equal("type", "answer"),
        Query.orderDesc("$createdAt"),
      ])
    )
  );

  // Collect all unique author IDs
  const allAuthorIds = [
    question.authorId,
    ...questionComments.documents.map(c => c.authorId),
    ...answers.documents.map(a => a.authorId),
    ...answerCommentsList.flatMap(cl => cl.documents.map(c => c.authorId)),
  ];

  // Batch fetch all users at once (with caching)
  const usersMap = await batchFetchUsers(allAuthorIds);

  // Enrich data with author info
  const enrichedQuestionComments = {
    ...questionComments,
    documents: questionComments.documents.map(comment => ({
      ...comment,
      author: usersMap.get(comment.authorId),
    })),
  };

  const enrichedAnswers = {
    ...answers,
    documents: answers.documents.map((answer, i) => ({
      ...answer,
      voteCount: answer.voteCount ?? 0,
      author: usersMap.get(answer.authorId),
      comments: {
        ...answerCommentsList[i],
        documents: answerCommentsList[i].documents.map(comment => ({
          ...comment,
          author: usersMap.get(comment.authorId),
        })),
      },
    })),
  };

  const author = usersMap.get(question.authorId);

  return (
    <TracingBeam className="container pl-6">
      <Particles
        className="fixed inset-0 h-full w-full"
        quantity={500}
        ease={100}
        color="#ffffff"
        refresh
      />
      <div className="relative mx-auto max-w-4xl px-4 pt-36 pb-20">
        {/* Question header */}
        <header className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
              {question.title}
            </h1>
            <Link href="/questions/ask" className="shrink-0">
              <ShimmerButton className="shadow-2xl">
                <span className="text-center text-sm leading-none font-medium tracking-tight whitespace-pre-wrap text-white lg:text-lg dark:from-white dark:to-slate-900/10">
                  Ask a question
                </span>
              </ShimmerButton>
            </Link>
          </div>
          
          {/* Question meta */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400">
            <span>
              Asked {convertDateToRelativeTime(new Date(question.$createdAt))}
            </span>
            <span className="text-gray-500">•</span>
            <span>{answers.total} answer{answers.total !== 1 ? "s" : ""}</span>
            <span className="text-gray-500">•</span>
            <span>{question.voteCount ?? 0} vote{(question.voteCount ?? 0) !== 1 ? "s" : ""}</span>
          </div>
        </header>

        <hr className="mb-6 border-white/10" />

        {/* Question body */}
        <article className="mb-8">
          <div className="flex gap-6">
            {/* Vote column - fixed width */}
            <aside className="flex shrink-0 flex-col items-center gap-3">
              <VoteButtons
                type="question"
                id={question.$id}
                className="w-full"
                initialVoteCount={question.voteCount ?? 0}
              />
              <div className="flex flex-col gap-2">
                <EditQuestion
                  questionId={question.$id}
                  questionTitle={question.title}
                  authorId={question.authorId}
                />
                <DeleteQuestion
                  questionId={question.$id}
                  authorId={question.authorId}
                />
              </div>
            </aside>

            {/* Content column */}
            <div className="min-w-0 flex-1">
              {/* Question content */}
              <div className="rounded-lg bg-white/5 p-4 sm:p-6">
                <MarkdownPreview source={question.content} />
              </div>

              {/* Attachment */}
              {question.attachmentId && (
                <div className="mt-4">
                  <picture>
                    <img
                      src={storage.getFilePreview(
                        questionAttachmentBucket,
                        question.attachmentId,
                      )}
                      alt={question.title}
                      className="rounded-lg border border-white/10"
                    />
                  </picture>
                </div>
              )}

              {/* Tags */}
              <div className="mt-4 flex flex-wrap gap-2">
                {question.tags.map((tag: string) => (
                  <Link
                    key={tag}
                    href={`/questions?tag=${tag}`}
                    className="inline-flex items-center rounded-md bg-orange-500/10 px-2.5 py-1 text-sm text-orange-400 transition-colors hover:bg-orange-500/20"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>

              {/* Author card */}
              <div className="mt-6 flex justify-end">
                <div className="rounded-lg bg-blue-500/10 px-4 py-3">
                  <p className="mb-2 text-xs text-gray-400">
                    asked {convertDateToRelativeTime(new Date(question.$createdAt))}
                  </p>
                  <div className="flex items-center gap-3">
                    <picture>
                      <img
                        src={avatars.getInitials(author?.name || "?", 40, 40)}
                        alt={author?.name || "Unknown"}
                        className="rounded-lg"
                      />
                    </picture>
                    <div>
                      <Link
                        href={`/users/${author?.$id}/${slugify(author?.name || "user")}`}
                        className="font-medium text-blue-400 hover:text-blue-300"
                      >
                        {author?.name || "Unknown"}
                      </Link>
                      <p className="text-sm text-gray-400">
                        {author?.reputation || 0} reputation
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments */}
              <Comments
                comments={enrichedQuestionComments}
                className="mt-6 border-t border-white/10 pt-4"
                type="question"
                typeId={question.$id}
              />
            </div>
          </div>
        </article>

        {/* Answers section */}
        <section className="mt-8 border-t border-white/10 pt-8">
          <Answers answers={enrichedAnswers} questionId={question.$id} />
        </section>
      </div>
    </TracingBeam>
  );
};

export default Page;
