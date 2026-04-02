/**
 * Server-side authentication utilities
 * Verifies JWT tokens and extracts user information
 */

import { Client, Account } from "node-appwrite";
import env from "../app/env";
import { NextRequest } from "next/server";

export interface AuthUser {
  $id: string;
  name: string;
  email: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

/**
 * Verify the JWT token from the request and return the authenticated user
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    if (process.env.APPWRITE_MOCK === "true") {
      const authHeader = request.headers.get("Authorization");
      const jwt = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : request.cookies.get("jwt")?.value;

      if (!jwt) {
        return { success: false, error: "No authentication token provided" };
      }

      return {
        success: true,
        user: {
          $id: "user-1",
          name: "Test User",
          email: "qa@example.com",
        },
      };
    }

    // Get JWT from Authorization header or cookie
    const authHeader = request.headers.get("Authorization");
    const jwt = authHeader?.startsWith("Bearer ") 
      ? authHeader.slice(7) 
      : request.cookies.get("jwt")?.value;

    if (!jwt) {
      return { success: false, error: "No authentication token provided" };
    }

    // Create a client with the JWT
    const client = new Client()
      .setEndpoint(env.appwrite.endpoint)
      .setProject(env.appwrite.projectId)
      .setJWT(jwt);

    const account = new Account(client);
    
    // Verify the JWT by getting the current user
    const user = await account.get();

    return {
      success: true,
      user: {
        $id: user.$id,
        name: user.name,
        email: user.email,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Authentication failed",
    };
  }
}

/**
 * Helper to create an unauthorized response
 */
export function unauthorizedResponse(message = "Unauthorized") {
  return Response.json({ error: message }, { status: 401 });
}

/**
 * Helper to create a forbidden response
 */
export function forbiddenResponse(message = "Forbidden") {
  return Response.json({ error: message }, { status: 403 });
}
