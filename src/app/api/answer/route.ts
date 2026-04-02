import { answerCollection, db, questionCollection } from "../../../models/name";
import { databases, users } from "../../../models/server/config";
import { NextRequest } from "next/server";
import { ID, Permission, Role, Query } from "node-appwrite";
import { UserPrefs } from "../../../store/Auth";
import { verifyAuth } from "../../../lib/auth";
import { validateAnswer } from "../../../lib/validation";
import { checkRateLimit, RATE_LIMITS } from "../../../lib/rateLimit";
import { successResponse, errors, paginatedResponse } from "../../../lib/apiResponse";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("questionId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const sort = searchParams.get("sort") || "newest"; // newest, voted

    if (!questionId) {
      return errors.badRequest("questionId is required");
    }

    // Build query based on sort
    const queries = [
      Query.equal("questionId", questionId),
      Query.offset((page - 1) * limit),
      Query.limit(limit),
    ];

    if (sort === "voted") {
      queries.push(Query.orderDesc("voteCount"));
    } else {
      queries.push(Query.orderDesc("$createdAt"));
    }

    const answers = await databases.listDocuments(db, answerCollection, queries);

    return paginatedResponse(answers.documents, {
      page,
      limit,
      total: answers.total,
    });

  } catch (error: any) {
    return errors.internal(error?.message);
  }
}

export async function POST(request: NextRequest){
  try {
    // 1. Verify authentication
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return errors.unauthorized(auth.error);
    }

    // 2. Check rate limit
    const rateLimit = checkRateLimit(`answers:${auth.user.$id}`, RATE_LIMITS.answers);
    if (!rateLimit.allowed) {
      return errors.rateLimited(Math.ceil((rateLimit.resetTime - Date.now()) / 1000));
    }

    // 3. Parse and validate input
    const body = await request.json();
    const { questionId, answer: content } = body;
    
    const validation = validateAnswer({ content, questionId });
    if (!validation.valid) {
      return errors.validation(validation.errors);
    }

    // 4. Get question and verify it exists
    let question;
    try {
      question = await databases.getDocument(db, questionCollection, questionId);
    } catch {
      return errors.notFound("Question");
    }

    // 5. Create answer with document-level permissions
    const response = await databases.createDocument(
      db, 
      answerCollection, 
      ID.unique(), 
      {
        content: content.trim(),
        authorId: auth.user.$id,
        questionId: questionId,
        voteCount: 0,
      },
      [
        Permission.read(Role.any()),
        Permission.update(Role.user(auth.user.$id)),
        Permission.delete(Role.user(auth.user.$id)),
      ]
    );

    // 6. Update answer count on question
    await databases.updateDocument(db, questionCollection, questionId, {
      answerCount: (question.answerCount || 0) + 1,
    });

    // 7. Increase author reputation
    const prefs = await users.getPrefs<UserPrefs>(auth.user.$id);
    await users.updatePrefs(auth.user.$id, {
      reputation: Number(prefs.reputation || 0) + 1
    });

    return successResponse(response, 201);

  } catch (error: any) {
    return errors.internal(error?.message || "Error creating answer");
  }
}

export async function DELETE(request: NextRequest){
  try {
    // 1. Verify authentication
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return errors.unauthorized(auth.error);
    }

    const { answerId } = await request.json();

    if (!answerId || typeof answerId !== "string") {
      return errors.badRequest("Answer ID is required");
    }

    // 2. Get answer and verify ownership
    let answer;
    try {
      answer = await databases.getDocument(db, answerCollection, answerId);
    } catch {
      return errors.notFound("Answer");
    }
    
    if (answer.authorId !== auth.user.$id) {
      return errors.forbidden("You can only delete your own answers");
    }

    // 3. Delete the answer
    await databases.deleteDocument(db, answerCollection, answerId);

    // 4. Update answer count on question
    try {
      const question = await databases.getDocument(db, questionCollection, answer.questionId);
      await databases.updateDocument(db, questionCollection, answer.questionId, {
        answerCount: Math.max(0, (question.answerCount || 0) - 1),
      });
    } catch {
      // Question may have been deleted
    }

    // 5. Decrease the reputation
    const prefs = await users.getPrefs<UserPrefs>(answer.authorId);
    await users.updatePrefs(answer.authorId, {
      reputation: Math.max(0, Number(prefs.reputation || 0) - 1)
    });

    return successResponse({ deleted: true });

  } catch (error: any) {
    return errors.internal(error?.message || "Error deleting answer");
  }
}