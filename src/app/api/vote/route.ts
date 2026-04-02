import {
  answerCollection,
  db,
  questionCollection,
  voteCollection,
} from "../../../models/name";
import { databases, users } from "../../../models/server/config";
import { UserPrefs } from "../../../store/Auth";
import { NextRequest } from "next/server";
import { ID, Query, Permission, Role } from "node-appwrite";
import { verifyAuth } from "../../../lib/auth";
import { validateVote } from "../../../lib/validation";
import { checkRateLimit, RATE_LIMITS } from "../../../lib/rateLimit";
import { successResponse, errors } from "../../../lib/apiResponse";

export async function POST(request: NextRequest) {
    try {
        // 1. Verify authentication
        const auth = await verifyAuth(request);
        if (!auth.success || !auth.user) {
            return errors.unauthorized(auth.error);
        }

        // 2. Check rate limit
        const rateLimit = checkRateLimit(`votes:${auth.user.$id}`, RATE_LIMITS.votes);
        if (!rateLimit.allowed) {
            return errors.rateLimited(Math.ceil((rateLimit.resetTime - Date.now()) / 1000));
        }

        // 3. Parse and validate input
        const body = await request.json();
        const { voteStatus, type, typeId } = body;
        const votedById = auth.user.$id;

        const validation = validateVote({ type, typeId, voteStatus });
        if (!validation.valid) {
            return errors.validation(validation.errors);
        }

        const targetCollection = type === "question" ? questionCollection : answerCollection;

        // 4. Get the target document (question/answer)
        let target;
        try {
            target = await databases.getDocument(db, targetCollection, typeId);
        } catch {
            return errors.notFound(type);
        }

        // 5. Check for existing vote
        const existingVotes = await databases.listDocuments(db, voteCollection, [
            Query.equal("type", type),
            Query.equal("typeId", typeId),
            Query.equal("votedById", votedById),
            Query.limit(1),
        ]);

        const existingVote = existingVotes.documents[0];
        let voteCountDelta = 0;
        let reputationDelta = 0;
        let resultDoc = null;
        let message = "";

        if (existingVote) {
            // Delete existing vote
            await databases.deleteDocument(db, voteCollection, existingVote.$id);
            
            // Calculate deltas for removing old vote
            if (existingVote.voteStatus === "upvoted") {
                voteCountDelta -= 1;
                reputationDelta -= 1;
            } else {
                voteCountDelta += 1;
                reputationDelta += 1;
            }

            // If same vote status, this is a toggle off (withdraw)
            if (existingVote.voteStatus === voteStatus) {
                message = "Vote withdrawn";
            }
        }

        // Create new vote if different from existing (or no existing)
        if (!existingVote || existingVote.voteStatus !== voteStatus) {
            resultDoc = await databases.createDocument(
                db, 
                voteCollection, 
                ID.unique(), 
                { type, typeId, voteStatus, votedById },
                [
                    Permission.read(Role.any()),
                    Permission.update(Role.user(votedById)),
                    Permission.delete(Role.user(votedById)),
                ]
            );

            // Calculate deltas for new vote
            if (voteStatus === "upvoted") {
                voteCountDelta += 1;
                reputationDelta += 1;
            } else {
                voteCountDelta -= 1;
                reputationDelta -= 1;
            }

            message = existingVote ? "Vote changed" : "Voted";
        }

        // 6. Update vote count on target document (optimized - no more counting queries!)
        const currentVoteCount = target.voteCount || 0;
        const newVoteCount = currentVoteCount + voteCountDelta;
        
        await databases.updateDocument(db, targetCollection, typeId, {
            voteCount: newVoteCount,
        });

        // 7. Update author reputation
        if (reputationDelta !== 0) {
            const authorPrefs = await users.getPrefs<UserPrefs>(target.authorId);
            const currentRep = Number(authorPrefs.reputation) || 0;
            await users.updatePrefs<UserPrefs>(target.authorId, {
                reputation: Math.max(0, currentRep + reputationDelta),
            });
        }

        return successResponse({
            vote: resultDoc,
            voteCount: newVoteCount,
            message,
        }, resultDoc ? 201 : 200);

    } catch (error: any) {
        console.error("Vote error:", error);
        return errors.internal(error?.message || "Error processing vote");
    }
}
