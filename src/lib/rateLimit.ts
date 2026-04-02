/**
 * Simple in-memory rate limiting
 * For production, consider using Redis or a dedicated service
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Store rate limit data in memory (per-instance, resets on restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

export interface RateLimitConfig {
  /** Maximum number of requests allowed */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

// Default rate limits for different actions
export const RATE_LIMITS = {
  questions: { limit: 5, windowSeconds: 3600 }, // 5 questions per hour
  answers: { limit: 20, windowSeconds: 3600 },   // 20 answers per hour
  comments: { limit: 30, windowSeconds: 3600 },  // 30 comments per hour
  votes: { limit: 60, windowSeconds: 3600 },     // 60 votes per hour
};

/**
 * Check if a request is rate limited
 * @param identifier Unique identifier (usually `action:userId`)
 * @param config Rate limit configuration
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // If no entry or window has expired, create new entry
  if (!entry || entry.resetTime < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowSeconds * 1000,
    };
    rateLimitStore.set(identifier, newEntry);
    return {
      allowed: true,
      remaining: config.limit - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;
  return {
    allowed: true,
    remaining: config.limit - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Helper to create a rate limit exceeded response
 */
export function rateLimitResponse(resetTime: number) {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  return Response.json(
    { error: "Rate limit exceeded. Please try again later." },
    { 
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Reset": String(Math.ceil(resetTime / 1000)),
      },
    }
  );
}
