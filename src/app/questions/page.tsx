import { databases, users } from "../../models/server/config";
import {
  db,
  questionCollection,
} from "../../models/name";
import { Query } from "node-appwrite";
import React, { Suspense } from "react";
import Link from "next/link";
import ShimmerButton from "../../components/magicui/shimmer-button";
import QuestionCard from "../../components/QuestionCard";
import { UserPrefs } from "../../store/Auth";
import Pagination from "../../components/Pagination";
import Search from "./Search";
import SortTabs from "../../components/SortTabs";
import { TagFilter } from "../../components/TagFilter";
import { NoQuestions } from "../../components/ui/EmptyState";
import { unstable_cache } from "next/cache";

// Valid sort options
const SORT_OPTIONS = {
  newest: { field: "$createdAt", order: "desc" as const },
  voted: { field: "voteCount", order: "desc" as const },
  unanswered: { field: "answerCount", order: "asc" as const },
};

// Popular tags (could be fetched from DB in production)
const POPULAR_TAGS = ["javascript", "react", "nextjs", "typescript", "css", "node", "python", "api"];

// Cache user lookups to avoid N+1 queries
const getCachedUser = unstable_cache(
  async (userId: string) => {
    const author = await users.get<UserPrefs>(userId);
    return {
      $id: author.$id,
      reputation: author.prefs?.reputation || 0,
      name: author.name,
    };
  },
  ["user"],
  { revalidate: 600 } // Cache users for 10 minutes
);

// Batch fetch unique authors to reduce queries
async function enrichQuestionsWithAuthors(documents: any[]) {
  // Get unique author IDs
  const authorIds = [...new Set(documents.map(q => q.authorId))];
  
  // Fetch all unique authors in parallel (deduplicated)
  const authorsMap = new Map();
  await Promise.all(
    authorIds.map(async (authorId) => {
      const author = await getCachedUser(authorId);
      authorsMap.set(authorId, author);
    })
  );
  
  // Enrich documents
  return documents.map(ques => ({
    ...ques,
    totalAnswers: ques.answerCount ?? 0,
    totalVotes: ques.voteCount ?? 0,
    author: authorsMap.get(ques.authorId),
  }));
}

const Page = async ({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tag?: string; search?: string; sort?: string }>;
}) => {
  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams.page || "1", 10);
  const sort = (resolvedSearchParams.sort || "newest") as keyof typeof SORT_OPTIONS;
  const sortConfig = SORT_OPTIONS[sort] || SORT_OPTIONS.newest;
  const activeTag = resolvedSearchParams.tag;
  const searchQuery = resolvedSearchParams.search;

  const queries = [
    Query.offset((page - 1) * 25),
    Query.limit(25),
  ];

  // Apply sort
  if (sortConfig.order === "desc") {
    queries.push(Query.orderDesc(sortConfig.field));
  } else {
    queries.push(Query.orderAsc(sortConfig.field));
  }

  // Filter unanswered questions
  if (sort === "unanswered") {
    queries.push(Query.equal("answerCount", 0));
  }

  if (activeTag)
    queries.push(Query.equal("tags", activeTag));
  if (searchQuery)
    queries.push(
      Query.or([
        Query.search("title", searchQuery),
        Query.search("content", searchQuery),
      ]),
    );

  const questions = await databases.listDocuments(
    db,
    questionCollection,
    queries,
  );

  // Enrich questions with cached author info
  const enrichedDocs = await enrichQuestionsWithAuthors(questions.documents);
  const hasFilters = Boolean(activeTag || searchQuery);

  return (
    <div className="container mx-auto px-4 pt-36 pb-20">
      <div className="mb-10 flex items-center justify-between">
        <h1 className="text-3xl font-bold">All Questions</h1>
        <Link href="/questions/ask">
          <ShimmerButton className="shadow-2xl">
            <span className="text-center text-sm leading-none font-medium tracking-tight whitespace-pre-wrap text-white lg:text-lg dark:from-white dark:to-slate-900/10">
              Ask a question
            </span>
          </ShimmerButton>
        </Link>
      </div>

      {/* Filters row */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Search />
        <SortTabs 
          options={[
            { value: "newest", label: "Newest" },
            { value: "voted", label: "Most Voted" },
            { value: "unanswered", label: "Unanswered" },
          ]}
          currentSort={sort}
        />
      </div>

      {/* Tag filter */}
      <Suspense fallback={null}>
        <TagFilter tags={POPULAR_TAGS} className="mb-6" />
      </Suspense>

      {/* Results info */}
      <div className="mb-4 flex items-center gap-4">
        <p className="text-gray-400">
          {questions.total} question{questions.total !== 1 ? "s" : ""}
          {activeTag && <span className="ml-1">tagged <strong className="text-orange-400">#{activeTag}</strong></span>}
          {searchQuery && <span className="ml-1">matching &ldquo;{searchQuery}&rdquo;</span>}
        </p>
      </div>

      {/* Questions list */}
      <div className="mb-6 max-w-3xl space-y-6">
        {enrichedDocs.length > 0 ? (
          enrichedDocs.map((ques) => (
            <QuestionCard key={ques.$id} ques={ques} />
          ))
        ) : (
          <NoQuestions hasSearch={hasFilters} />
        )}
      </div>

      {questions.total > 25 && (
        <Pagination total={questions.total} limit={25} />
      )}
    </div>
  );
};

export default Page;
