import { databases, users } from "../../../..//models/server/config";
import { UserPrefs } from "../../../..//store/Auth";
import React from "react";
import {
  MagicCard,
  MagicContainer,
} from "../../../..//components/magicui/magic-card";
import NumberTicker from "../../../..//components/magicui/number-ticker";
import {
  answerCollection,
  db,
  questionCollection,
  voteCollection,
} from "../../../..//models/name";
import { Query } from "node-appwrite";
import { IconMessage, IconThumbUp, IconMessageCircle, IconFlame } from "@tabler/icons-react";
import { unstable_cache } from "next/cache";

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description?: string;
}

function StatCard({ title, value, icon, description }: StatCardProps) {
  return (
    <MagicCard className="flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden p-8 shadow-2xl sm:p-12">
      <div className="absolute inset-x-4 top-4 flex items-center gap-2">
        <span className="text-orange-400">{icon}</span>
        <h2 className="text-lg font-medium sm:text-xl">{title}</h2>
      </div>
      <p className="z-10 text-3xl font-bold whitespace-nowrap text-gray-800 sm:text-4xl dark:text-gray-200">
        <NumberTicker value={value} />
      </p>
      {description && (
        <p className="mt-1 text-xs text-gray-500">{description}</p>
      )}
      <div className="pointer-events-none absolute inset-0 h-full bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
    </MagicCard>
  );
}

// Cache user stats to avoid repeated N+1 queries
const getUserStats = unstable_cache(
  async (userId: string) => {
    // Single optimized fetch: get counts using limit(1) for totals
    // and select only needed fields for vote calculation
    const [user, questionsCount, answersCount, votesGivenCount, questionsWithVotes, answersWithVotes] = await Promise.all([
      users.get<UserPrefs>(userId),
      databases.listDocuments(db, questionCollection, [
        Query.equal("authorId", userId),
        Query.limit(1), // Only need total count
      ]),
      databases.listDocuments(db, answerCollection, [
        Query.equal("authorId", userId),
        Query.limit(1),
      ]),
      databases.listDocuments(db, voteCollection, [
        Query.equal("votedById", userId),
        Query.limit(1),
      ]),
      // Get vote sums - limit to 25 most recent for performance
      databases.listDocuments(db, questionCollection, [
        Query.equal("authorId", userId),
        Query.select(["voteCount"]),
        Query.orderDesc("$createdAt"),
        Query.limit(25),
      ]),
      databases.listDocuments(db, answerCollection, [
        Query.equal("authorId", userId),
        Query.select(["voteCount"]),
        Query.orderDesc("$createdAt"),
        Query.limit(25),
      ]),
    ]);

    const questionVotes = questionsWithVotes.documents.reduce(
      (sum, q) => sum + (q.voteCount || 0), 0
    );
    const answerVotes = answersWithVotes.documents.reduce(
      (sum, a) => sum + (a.voteCount || 0), 0
    );
    const votesReceived = questionVotes + answerVotes;

    return {
      user,
      questionsTotal: questionsCount.total,
      answersTotal: answersCount.total,
      votesGivenTotal: votesGivenCount.total,
      votesReceived,
    };
  },
  ["user-stats"],
  { revalidate: 300 } // Cache for 5 minutes
);

const Page = async ({
  params,
}: {
  params: Promise<{ userId: string; userSlug: string }>;
}) => {
  const { userId } = await params;
  
  const { user, questionsTotal, answersTotal, votesGivenTotal, votesReceived } = 
    await getUserStats(userId);

  // Calculate engagement score
  const engagementScore = Math.round(
    (questionsTotal * 5) + (answersTotal * 10) + (votesReceived * 2)
  );

  return (
    <div className="space-y-6">
      {/* Primary stats row */}
      <MagicContainer className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Reputation"
          value={user.prefs?.reputation || 0}
          icon={<IconFlame className="h-5 w-5" />}
          description="Community standing"
        />
        <StatCard
          title="Questions"
          value={questionsTotal}
          icon={<IconMessageCircle className="h-5 w-5" />}
          description="Asked"
        />
        <StatCard
          title="Answers"
          value={answersTotal}
          icon={<IconMessage className="h-5 w-5" />}
          description="Contributed"
        />
        <StatCard
          title="Votes Received"
          value={votesReceived}
          icon={<IconThumbUp className="h-5 w-5" />}
          description="On questions & answers"
        />
      </MagicContainer>

      {/* Additional stats */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <h3 className="mb-4 text-lg font-semibold">Activity Summary</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-400">{votesGivenTotal}</p>
            <p className="text-sm text-gray-400">Votes Cast</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">
              {answersTotal > 0 ? Math.round((votesReceived / answersTotal) * 10) / 10 : 0}
            </p>
            <p className="text-sm text-gray-400">Avg Votes/Answer</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">{engagementScore}</p>
            <p className="text-sm text-gray-400">Engagement Score</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-400">
              {questionsTotal > 0 ? Math.round(answersTotal / questionsTotal * 10) / 10 : 0}
            </p>
            <p className="text-sm text-gray-400">Answer Ratio</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
