/**
 * User Service
 * Centralized user fetching with caching and batch operations
 */
import { unstable_cache } from "next/cache";
import { users } from "../models/server/config";
import type { UserPrefs } from "../store/Auth";

export interface AuthorInfo {
  $id: string;
  name: string;
  reputation: number;
}

/**
 * Get a single user's author info (cached)
 */
export const getCachedUser = unstable_cache(
  async (userId: string): Promise<AuthorInfo> => {
    const user = await users.get<UserPrefs>(userId);
    return {
      $id: user.$id,
      name: user.name,
      reputation: user.prefs?.reputation || 0,
    };
  },
  ["user"],
  { revalidate: 600 } // 10 minutes
);

/**
 * Batch fetch unique users and return as a Map
 * Deduplicates user IDs to minimize API calls
 */
export async function batchFetchUsers(authorIds: string[]): Promise<Map<string, AuthorInfo>> {
  const uniqueIds = [...new Set(authorIds.filter(Boolean))];
  const usersMap = new Map<string, AuthorInfo>();

  await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        const user = await getCachedUser(id);
        usersMap.set(id, user);
      } catch (error) {
        // Fallback for missing users
        usersMap.set(id, {
          $id: id,
          name: "Unknown User",
          reputation: 0,
        });
      }
    })
  );

  return usersMap;
}

/**
 * Enrich documents with author info
 * @param documents - Array of documents with authorId field
 * @returns Documents with author object added
 */
export async function enrichWithAuthors<T extends { authorId: string }>(
  documents: T[]
): Promise<(T & { author: AuthorInfo })[]> {
  if (documents.length === 0) return [];

  const authorIds = documents.map((doc) => doc.authorId);
  const authorsMap = await batchFetchUsers(authorIds);

  return documents.map((doc) => ({
    ...doc,
    author: authorsMap.get(doc.authorId) || {
      $id: doc.authorId,
      name: "Unknown User",
      reputation: 0,
    },
  }));
}

/**
 * Update user reputation
 * @param userId - User ID
 * @param delta - Amount to change (positive or negative)
 * @param minValue - Minimum reputation value (default 0)
 */
export async function updateReputation(
  userId: string,
  delta: number,
  minValue: number = 0
): Promise<void> {
  const prefs = await users.getPrefs<UserPrefs>(userId);
  const currentRep = Number(prefs.reputation || 0);
  const newRep = Math.max(minValue, currentRep + delta);

  await users.updatePrefs(userId, {
    ...prefs,
    reputation: newRep,
  });
}
