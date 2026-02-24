import { validateEnv } from "./env";
import { unsetEmptyEnv } from "./utils";

/**
 * Centralizes all environment setup logic.
 * This function should be called once in the root layout or middleware
 * to ensure consistent environment configuration across the application.
 *
 * It:
 * - Unsets empty environment variables that could cause "Invalid URL" errors
 * - Validates environment variables according to the schema
 */
export function setupEnvironment() {
  // Avoid "Invalid URL" crashes when env vars exist but are empty strings.
  unsetEmptyEnv("NEXTAUTH_URL");
  unsetEmptyEnv("NEXTAUTH_URL_INTERNAL");

  // Validate environment variables
  validateEnv();
}
