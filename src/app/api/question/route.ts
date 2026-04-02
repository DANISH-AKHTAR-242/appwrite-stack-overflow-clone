import { db, questionCollection, questionAttachmentBucket } from "../../../models/name";
import { databases, storage, users } from "../../../models/server/config";
import { NextRequest } from "next/server";
import { ID, Permission, Role, Query } from "node-appwrite";
import { UserPrefs } from "../../../store/Auth";
import { verifyAuth } from "../../../lib/auth";
import { validateQuestion } from "../../../lib/validation";
import { checkRateLimit, RATE_LIMITS } from "../../../lib/rateLimit";
import { successResponse, errors, paginatedResponse } from "../../../lib/apiResponse";

// Valid sort options
const SORT_OPTIONS = {
  newest: { field: "$createdAt", order: "desc" },
  oldest: { field: "$createdAt", order: "asc" },
  voted: { field: "voteCount", order: "desc" },
  unanswered: { field: "answerCount", order: "asc" },
} as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "25"), 50);
    const sort = (searchParams.get("sort") || "newest") as keyof typeof SORT_OPTIONS;
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");

    // Build queries
    const queries = [
      Query.offset((page - 1) * limit),
      Query.limit(limit),
    ];

    // Add sort
    const sortConfig = SORT_OPTIONS[sort] || SORT_OPTIONS.newest;
    if (sortConfig.order === "desc") {
      queries.push(Query.orderDesc(sortConfig.field));
    } else {
      queries.push(Query.orderAsc(sortConfig.field));
    }

    // Filter by unanswered (answerCount = 0)
    if (sort === "unanswered") {
      queries.push(Query.equal("answerCount", 0));
    }

    // Filter by tag
    if (tag) {
      queries.push(Query.equal("tags", tag));
    }

    // Search
    if (search) {
      queries.push(
        Query.or([
          Query.search("title", search),
          Query.search("content", search),
        ])
      );
    }

    const questions = await databases.listDocuments(db, questionCollection, queries);

    // Enrich with author info
    const enrichedQuestions = await Promise.all(
      questions.documents.map(async (q) => {
        const author = await users.get<UserPrefs>(q.authorId);
        return {
          ...q,
          author: {
            $id: author.$id,
            name: author.name,
            reputation: author.prefs?.reputation || 0,
          },
        };
      })
    );

    return paginatedResponse(enrichedQuestions, {
      page,
      limit,
      total: questions.total,
    });

  } catch (error: any) {
    return errors.internal(error?.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return errors.unauthorized(auth.error);
    }

    // 2. Check rate limit
    const rateLimit = checkRateLimit(`questions:${auth.user.$id}`, RATE_LIMITS.questions);
    if (!rateLimit.allowed) {
      return errors.rateLimited(Math.ceil((rateLimit.resetTime - Date.now()) / 1000));
    }

    // 3. Parse and validate input
    const body = await request.json();
    const { title, content, tags, attachmentId } = body;

    const validation = validateQuestion({ title, content, tags });
    if (!validation.valid) {
      return errors.validation(validation.errors);
    }

    // 4. Create question with document-level permissions
    const response = await databases.createDocument(
      db,
      questionCollection,
      ID.unique(),
      {
        title: title.trim(),
        content: content.trim(),
        authorId: auth.user.$id,
        tags: tags.map((t: string) => t.trim().toLowerCase()),
        attachmentId: attachmentId || null,
        voteCount: 0,
        answerCount: 0,
      },
      [
        Permission.read(Role.any()),
        Permission.update(Role.user(auth.user.$id)),
        Permission.delete(Role.user(auth.user.$id)),
      ]
    );

    // 5. Increase author reputation
    const prefs = await users.getPrefs<UserPrefs>(auth.user.$id);
    await users.updatePrefs(auth.user.$id, {
      reputation: Number(prefs.reputation || 0) + 1
    });

    return successResponse(response, 201);

  } catch (error: any) {
    return errors.internal(error?.message || "Error creating question");
  }
}

export async function PUT(request: NextRequest) {
  try {
    // 1. Verify authentication
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return errors.unauthorized(auth.error);
    }

    // 2. Parse and validate input
    const body = await request.json();
    const { questionId, title, content, tags, attachmentId } = body;

    if (!questionId || typeof questionId !== "string") {
      return errors.badRequest("Question ID is required");
    }

    const validation = validateQuestion({ title, content, tags });
    if (!validation.valid) {
      return errors.validation(validation.errors);
    }

    // 3. Get question and verify ownership
    let question;
    try {
      question = await databases.getDocument(db, questionCollection, questionId);
    } catch {
      return errors.notFound("Question");
    }

    if (question.authorId !== auth.user.$id) {
      return errors.forbidden("You can only edit your own questions");
    }

    // 4. Update question
    const response = await databases.updateDocument(
      db,
      questionCollection,
      questionId,
      {
        title: title.trim(),
        content: content.trim(),
        tags: tags.map((t: string) => t.trim().toLowerCase()),
        attachmentId: attachmentId || question.attachmentId,
      }
    );

    return successResponse(response);

  } catch (error: any) {
    return errors.internal(error?.message || "Error updating question");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 1. Verify authentication
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return errors.unauthorized(auth.error);
    }

    const { questionId } = await request.json();

    if (!questionId || typeof questionId !== "string") {
      return errors.badRequest("Question ID is required");
    }

    // 2. Get question and verify ownership
    let question;
    try {
      question = await databases.getDocument(db, questionCollection, questionId);
    } catch {
      return errors.notFound("Question");
    }

    if (question.authorId !== auth.user.$id) {
      return errors.forbidden("You can only delete your own questions");
    }

    // 3. Delete attachment if exists
    if (question.attachmentId) {
      try {
        await storage.deleteFile(questionAttachmentBucket, question.attachmentId);
      } catch {
        // Ignore if file doesn't exist
      }
    }

    // 4. Delete the question
    await databases.deleteDocument(db, questionCollection, questionId);

    // 5. Decrease reputation
    const prefs = await users.getPrefs<UserPrefs>(auth.user.$id);
    await users.updatePrefs(auth.user.$id, {
      reputation: Math.max(0, Number(prefs.reputation || 0) - 1)
    });

    return successResponse({ deleted: true });

  } catch (error: any) {
    return errors.internal(error?.message || "Error deleting question");
  }
}
