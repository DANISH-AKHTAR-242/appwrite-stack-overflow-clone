/**
 * Server-side validation utilities
 * Validates and sanitizes user input
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Validation constraints
const CONSTRAINTS = {
  question: {
    title: { min: 10, max: 100 },
    content: { min: 20, max: 10000 },
    tags: { min: 1, max: 5, tagMaxLength: 30 },
  },
  answer: {
    content: { min: 10, max: 10000 },
  },
  comment: {
    content: { min: 1, max: 1000 },
  },
};

/**
 * Validate question input
 */
export function validateQuestion(data: {
  title?: string;
  content?: string;
  tags?: string[];
}): ValidationResult {
  const errors: string[] = [];
  const { title, content, tags } = data;

  // Title validation
  if (!title || typeof title !== "string") {
    errors.push("Title is required");
  } else {
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < CONSTRAINTS.question.title.min) {
      errors.push(`Title must be at least ${CONSTRAINTS.question.title.min} characters`);
    }
    if (trimmedTitle.length > CONSTRAINTS.question.title.max) {
      errors.push(`Title must be at most ${CONSTRAINTS.question.title.max} characters`);
    }
  }

  // Content validation
  if (!content || typeof content !== "string") {
    errors.push("Content is required");
  } else {
    const trimmedContent = content.trim();
    if (trimmedContent.length < CONSTRAINTS.question.content.min) {
      errors.push(`Content must be at least ${CONSTRAINTS.question.content.min} characters`);
    }
    if (trimmedContent.length > CONSTRAINTS.question.content.max) {
      errors.push(`Content must be at most ${CONSTRAINTS.question.content.max} characters`);
    }
  }

  // Tags validation
  if (!tags || !Array.isArray(tags)) {
    errors.push("At least one tag is required");
  } else {
    if (tags.length < CONSTRAINTS.question.tags.min) {
      errors.push(`At least ${CONSTRAINTS.question.tags.min} tag is required`);
    }
    if (tags.length > CONSTRAINTS.question.tags.max) {
      errors.push(`Maximum ${CONSTRAINTS.question.tags.max} tags allowed`);
    }
    for (const tag of tags) {
      if (typeof tag !== "string" || tag.trim().length === 0) {
        errors.push("Invalid tag format");
        break;
      }
      if (tag.length > CONSTRAINTS.question.tags.tagMaxLength) {
        errors.push(`Each tag must be at most ${CONSTRAINTS.question.tags.tagMaxLength} characters`);
        break;
      }
      // Only allow alphanumeric, hyphens, and dots
      if (!/^[a-zA-Z0-9\-\.]+$/.test(tag)) {
        errors.push("Tags can only contain letters, numbers, hyphens, and dots");
        break;
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate answer input
 */
export function validateAnswer(data: {
  content?: string;
  questionId?: string;
}): ValidationResult {
  const errors: string[] = [];
  const { content, questionId } = data;

  // Content validation
  if (!content || typeof content !== "string") {
    errors.push("Answer content is required");
  } else {
    const trimmedContent = content.trim();
    if (trimmedContent.length < CONSTRAINTS.answer.content.min) {
      errors.push(`Answer must be at least ${CONSTRAINTS.answer.content.min} characters`);
    }
    if (trimmedContent.length > CONSTRAINTS.answer.content.max) {
      errors.push(`Answer must be at most ${CONSTRAINTS.answer.content.max} characters`);
    }
  }

  // Question ID validation
  if (!questionId || typeof questionId !== "string") {
    errors.push("Question ID is required");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate comment input
 */
export function validateComment(data: {
  content?: string;
  type?: string;
  typeId?: string;
}): ValidationResult {
  const errors: string[] = [];
  const { content, type, typeId } = data;

  // Content validation
  if (!content || typeof content !== "string") {
    errors.push("Comment content is required");
  } else {
    const trimmedContent = content.trim();
    if (trimmedContent.length < CONSTRAINTS.comment.content.min) {
      errors.push(`Comment must be at least ${CONSTRAINTS.comment.content.min} character`);
    }
    if (trimmedContent.length > CONSTRAINTS.comment.content.max) {
      errors.push(`Comment must be at most ${CONSTRAINTS.comment.content.max} characters`);
    }
  }

  // Type validation
  if (!type || (type !== "question" && type !== "answer")) {
    errors.push("Invalid comment type");
  }

  // Type ID validation
  if (!typeId || typeof typeId !== "string") {
    errors.push("Type ID is required");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate vote input
 */
export function validateVote(data: {
  type?: string;
  typeId?: string;
  voteStatus?: string;
}): ValidationResult {
  const errors: string[] = [];
  const { type, typeId, voteStatus } = data;

  // Type validation
  if (!type || (type !== "question" && type !== "answer")) {
    errors.push("Invalid vote type");
  }

  // Type ID validation
  if (!typeId || typeof typeId !== "string") {
    errors.push("Type ID is required");
  }

  // Vote status validation
  if (!voteStatus || (voteStatus !== "upvoted" && voteStatus !== "downvoted")) {
    errors.push("Invalid vote status");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Helper to create a validation error response
 */
export function validationErrorResponse(errors: string[]) {
  return Response.json({ error: "Validation failed", errors }, { status: 400 });
}
