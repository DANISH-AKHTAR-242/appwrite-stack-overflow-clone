import { z } from "zod";

/**
 * Environment variable schema with validation
 * Validates at build time to catch missing env vars early
 */
const envSchema = z.object({
  // Public vars (exposed to client)
  NEXT_PUBLIC_APPWRITE_ENDPOINT: z
    .string()
    .url("NEXT_PUBLIC_APPWRITE_ENDPOINT must be a valid URL"),
  NEXT_PUBLIC_APPWRITE_PROJECT_ID: z
    .string()
    .min(1, "NEXT_PUBLIC_APPWRITE_PROJECT_ID is required"),

  // Server-only vars
  APPWRITE_API_KEY: z.string().min(1, "APPWRITE_API_KEY is required"),
});

// Parse and validate environment variables
function validateEnv() {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_APPWRITE_ENDPOINT: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
    NEXT_PUBLIC_APPWRITE_PROJECT_ID: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
    APPWRITE_API_KEY: process.env.APPWRITE_API_KEY,
  });

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    console.error(parsed.error.flatten().fieldErrors);

    // In development, show helpful message
    if (process.env.NODE_ENV === "development") {
      console.error("\n📝 Create a .env.local file with the required variables.");
    }

    throw new Error("Invalid environment variables");
  }

  return parsed.data;
}

// Only validate in server context (not during client-side hydration)
const isServer = typeof window === "undefined";
const validatedEnv = isServer ? validateEnv() : null;

const env = {
  appwrite: {
    endpoint:
      validatedEnv?.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
      process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
      "",
    projectId:
      validatedEnv?.NEXT_PUBLIC_APPWRITE_PROJECT_ID ||
      process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ||
      "",
    apiKey: validatedEnv?.APPWRITE_API_KEY || process.env.APPWRITE_API_KEY || "",
  },
};

export default env;
