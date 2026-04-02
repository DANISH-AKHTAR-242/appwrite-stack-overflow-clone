import { commentCollection, db, questionCollection, answerCollection } from "../../../models/name";
import { databases } from "../../../models/server/config";
import { NextRequest } from "next/server";
import { ID, Permission, Role } from "node-appwrite";
import { verifyAuth } from "../../../lib/auth";
import { validateComment } from "../../../lib/validation";
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
    const rateLimit = checkRateLimit(`comments:${auth.user.$id}`, RATE_LIMITS.comments);
    if (!rateLimit.allowed) {
      return errors.rateLimited(Math.ceil((rateLimit.resetTime - Date.now()) / 1000));
    }

    // 3. Parse and validate input
    const body = await request.json();
    const { content, type, typeId } = body;

    const validation = validateComment({ content, type, typeId });
    if (!validation.valid) {
      return errors.validation(validation.errors);
    }

    // 4. Verify the target (question/answer) exists
    try {
      await databases.getDocument(
        db,
        type === "question" ? questionCollection : answerCollection,
        typeId
      );
    } catch {
      return errors.notFound(type);
    }

    // 5. Create comment with document-level permissions
    const response = await databases.createDocument(
      db,
      commentCollection,
      ID.unique(),
      {
        content: content.trim(),
        authorId: auth.user.$id,
        type,
        typeId,
      },
      [
        Permission.read(Role.any()),
        Permission.update(Role.user(auth.user.$id)),
        Permission.delete(Role.user(auth.user.$id)),
      ]
    );

    return successResponse(response, 201);

  } catch (error: any) {
    return errors.internal(error?.message || "Error creating comment");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 1. Verify authentication
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return errors.unauthorized(auth.error);
    }

    const { commentId } = await request.json();

    if (!commentId || typeof commentId !== "string") {
      return errors.badRequest("Comment ID is required");
    }

    // 2. Get comment and verify ownership
    let comment;
    try {
      comment = await databases.getDocument(db, commentCollection, commentId);
    } catch {
      return errors.notFound("Comment");
    }

    if (comment.authorId !== auth.user.$id) {
      return errors.forbidden("You can only delete your own comments");
    }

    // 3. Delete the comment
    await databases.deleteDocument(db, commentCollection, commentId);

    return successResponse({ deleted: true });

  } catch (error: any) {
    return errors.internal(error?.message || "Error deleting comment");
  }
}
