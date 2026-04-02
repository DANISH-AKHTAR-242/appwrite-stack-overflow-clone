/**
 * Standardized API response helpers
 * Provides consistent response format across all endpoints
 */

import { NextResponse } from "next/server";

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string[];
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Create a successful response with data
 */
export function successResponse<T>(
  data: T,
  status = 200,
  meta?: ApiSuccessResponse["meta"]
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
  };
  if (meta) {
    response.meta = meta;
  }
  return NextResponse.json(response, { status });
}

/**
 * Create a paginated success response
 */
export function paginatedResponse<T>(
  data: T[],
  { page, limit, total }: { page: number; limit: number; total: number }
): NextResponse<ApiSuccessResponse<T[]>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        page,
        limit,
        total,
        hasMore: page * limit < total,
      },
    },
    { status: 200 }
  );
}

/**
 * Create an error response
 */
export function errorResponse(
  code: string,
  message: string,
  status = 500,
  details?: string[]
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
    },
  };
  if (details) {
    response.error.details = details;
  }
  return NextResponse.json(response, { status });
}

// Common error responses
export const errors = {
  unauthorized: (message = "Authentication required") =>
    errorResponse("UNAUTHORIZED", message, 401),

  forbidden: (message = "Permission denied") =>
    errorResponse("FORBIDDEN", message, 403),

  notFound: (resource = "Resource") =>
    errorResponse("NOT_FOUND", `${resource} not found`, 404),

  badRequest: (message: string, details?: string[]) =>
    errorResponse("BAD_REQUEST", message, 400, details),

  validation: (errors: string[]) =>
    errorResponse("VALIDATION_ERROR", "Validation failed", 400, errors),

  rateLimited: (retryAfter: number) => {
    const response = errorResponse(
      "RATE_LIMITED",
      "Too many requests. Please try again later.",
      429
    );
    response.headers.set("Retry-After", String(retryAfter));
    return response;
  },

  internal: (message = "An unexpected error occurred") =>
    errorResponse("INTERNAL_ERROR", message, 500),
};
