# Code Review & Best Practices Recommendations

## IGRP Framework Next.js Template - Demo Project

**Date:** February 9, 2026  
**Last Review:** March 3, 2026  
**Reviewer:** AI Code Review  
**Project:** `templates/demo/`

---

## Implementation Status (March 2026)

| # | Item | Status |
|---|------|--------|
| 1 | Environment Variable Validation | ✅ Done (`src/lib/env.ts`) |
| 2 | Type Safety | ✅ Done (createPreviewSession, proper types) |
| 3 | Error Handling | ✅ Done (`src/lib/errors.ts`, logger) |
| 4 | Code Duplication | ✅ Done (`src/lib/env-setup.ts`) |
| 5 | Magic Numbers | ✅ Done (`src/lib/constants.ts`) |
| 6 | File System Operations | ✅ Done (async fs.promises, caching) |
| 7 | Preview Mode Checks | ✅ Done (isPreviewMode() everywhere) |
| 8 | Input Validation | ✅ Done (`src/lib/sanitize.ts`, layout try/catch) |
| 9 | Type Definitions | ✅ Done (`src/types/env.d.ts`) |
| 10 | Logging Strategy | ✅ Done (`src/lib/logger.ts`) |
| 11 | Security | ✅ Done (headers, CSRF, sanitize, secure cookies) |
| 12 | Performance | ✅ Done (caching, memo, Suspense) |
| 13 | Testing | ⏳ Pending |
| 14 | Documentation | ✅ Done (JSDoc, token/route docs) |
| 15 | Code Organization | ⏳ Optional (barrel exports) |

---

## Executive Summary

This is a well-structured Next.js 15 application using the App Router with TypeScript, authentication via NextAuth/Keycloak, and the IGRP framework. The codebase has been significantly improved with environment validation, type safety, error handling, security hardening, and documentation.

**Overall Grade: A-**

---

## 🎯 Strengths

1. ✅ **Modern Stack**: Next.js 15, React 19, TypeScript, Biome for linting
2. ✅ **Good Structure**: Clear separation of concerns with actions, lib, config directories
3. ✅ **Type Safety**: TypeScript usage throughout
4. ✅ **Server Actions**: Proper use of "use server" directives
5. ✅ **Error Boundaries**: Error.tsx and loading.tsx components present
6. ✅ **Code Formatting**: Biome configured for consistent formatting
7. ✅ **Environment Variables**: Good documentation in `.env.example`

---

## 🔴 Critical Issues

### 1. **Environment Variable Validation Missing** done

**Issue:** No runtime validation of required environment variables. Missing values cause runtime errors instead of startup failures.

**Location:** Multiple files (auth.ts, auth-options.ts, middleware.ts, etc.)

**Impact:** High - Production failures, security risks

**Recommendation:**

```typescript
// Create: src/lib/env.ts
import { z } from "zod";

const envSchema = z.object({
  // Required in production
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  KEYCLOAK_CLIENT_ID: z.string().min(1),
  KEYCLOAK_CLIENT_SECRET: z.string().min(1),
  KEYCLOAK_ISSUER: z.string().url(),
  IGRP_ACCESS_MANAGEMENT_API: z.string().url(),
  IGRP_APP_CODE: z.string().min(1),
  
  // Optional
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_URL_INTERNAL: z.string().url().optional(),
  IGRP_PREVIEW_MODE: z.enum(["true", "false"]).optional(),
  // ... other env vars
});

export function validateEnv() {
  const isProduction = process.env.NODE_ENV === "production";
  
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors
        .filter(e => e.code === "invalid_type" && e.received === "undefined")
        .map(e => e.path.join("."));
      
      if (isProduction && missing.length > 0) {
        throw new Error(
          `Missing required environment variables: ${missing.join(", ")}`
        );
      }
    }
    throw error;
  }
}

// Call in middleware.ts, auth-options.ts, etc.
```

---

### 2. **Type Safety Issues** done

**Issue:** Use of `as any` and unsafe type assertions

**Location:**

- `src/actions/igrp/layout.ts:26` - `as any` for preview session
- `src/app/(igrp)/layout.tsx:18` - `as IGRPLayoutConfigArgs` assertion

**Recommendation:**

```typescript
// Instead of:
const session = isPreviewMode()
  ? ({
      user: { name: "Preview User", email: "preview@example.com" },
      accessToken: "preview-token",
      expires: "9999-12-31T23:59:59.999Z",
    } as any)

// Use proper typing:
import type { Session } from "@igrp/framework-next-auth";

const createPreviewSession = (): Session => ({
  user: { name: "Preview User", email: "preview@example.com" },
  accessToken: "preview-token",
  expires: "9999-12-31T23:59:59.999Z",
  expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
});

const session = isPreviewMode() 
  ? createPreviewSession()
  : await getAccessToken();
```

---

### 3. **Error Handling Inconsistencies** done

**Issue:** Inconsistent error handling patterns across the codebase

**Locations:**

- `src/actions/igrp/auth.ts` - Try/catch returns null
- `src/lib/config/get-routes.ts` - Console.warn but no error propagation
- `src/middleware.ts` - No error handling for getToken failures

**Recommendation:**

```typescript
// Create: src/lib/errors.ts
export class EnvValidationError extends Error {
  constructor(message: string, public missingVars: string[]) {
    super(message);
    this.name = "EnvValidationError";
  }
}

export class AuthError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "AuthError";
  }
}

// Use consistent error handling:
export async function serverSession() {
  try {
    validateEnv(); // Validate before proceeding
    
    const session = await getServerSession(authOptions);
    // ... rest of logic
  } catch (error) {
    if (error instanceof EnvValidationError) {
      // Log and handle appropriately
      console.error("[Auth] Environment validation failed:", error.message);
      if (process.env.NODE_ENV === "production") {
        throw error; // Fail fast in production
      }
    }
    // ... other error types
    return null;
  }
}
```

---

## 🟡 Important Improvements

### 4. **Code Duplication** done

**Issue:** Duplicate `unsetEmptyEnv` calls in both layout files

**Location:**

- `src/app/layout.tsx:26-27`
- `src/app/(igrp)/layout.tsx:14-15`

**Recommendation:**

```typescript
// Create: src/lib/env-setup.ts
export function setupEnvironment() {
  // Centralize all environment setup logic
  unsetEmptyEnv("NEXTAUTH_URL");
  unsetEmptyEnv("NEXTAUTH_URL_INTERNAL");
  
  // Add other setup logic here
  validateEnv();
}

// Call once in root layout or middleware
```

---

### 5. **Magic Numbers and Strings** done 

**Issue:** Hardcoded values scattered throughout code

**Locations:**

- `src/middleware.ts:35` - `60_000` milliseconds
- `src/actions/igrp/auth.ts:60` - `+ 60` seconds
- `src/lib/config/get-session-args.ts:14` - `5 * 60` seconds

**Recommendation:**

```typescript
// Create: src/lib/constants.ts
export const AUTH_CONSTANTS = {
  TOKEN_REFRESH_BUFFER_MS: 60_000, // 1 minute before expiry
  TOKEN_EXPIRY_BUFFER_SEC: 60, // 1 minute buffer
  SESSION_REFETCH_INTERVAL_SEC: 5 * 60, // 5 minutes
  PREVIEW_SESSION_EXPIRY: "9999-12-31T23:59:59.999Z",
} as const;

// Use throughout codebase
if (expiresAt !== undefined && expiresAt <= Date.now() + AUTH_CONSTANTS.TOKEN_REFRESH_BUFFER_MS) {
  // ...
}
```

---

### 6. **File System Operations in Runtime** done 

**Issue:** Synchronous file system read in `get-routes.ts` could fail in serverless environments

**Location:** `src/lib/config/get-routes.ts:7`

**Recommendation:**

```typescript
// Use async/await and handle errors gracefully
export async function getRoutes() {
  try {
    const file = path.join(process.cwd(), ".next/types/routes.d.ts");
    
    // Use async file read
    const content = await fs.promises.readFile(file, "utf8");
    
    // ... rest of logic
    
    return { appRoutes, paramMapBody };
  } catch (error) {
    // Log error with context
    console.warn("[Routes] Could not read routes file:", {
      error: error instanceof Error ? error.message : String(error),
      file: path.join(process.cwd(), ".next/types/routes.d.ts"),
    });
    
    // Return safe defaults instead of undefined
    return { appRoutes: [], paramMapBody: "" };
  }
}
```

---

### 7. **Inconsistent Preview Mode Checks** done 

**Issue:** Multiple ways to check preview mode

**Locations:**

- `src/lib/utils.ts` - `isPreviewMode()` function
- `src/actions/igrp/auth.ts:52` - Direct `process.env.IGRP_PREVIEW_MODE === "true"`
- `src/middleware.ts:21` - Uses `isPreviewMode()` from utils

**Recommendation:**

- Always use the `isPreviewMode()` utility function
- Remove direct `process.env.IGRP_PREVIEW_MODE` checks

---

### 8. **Missing Input Validation** done

**Issue:** No validation for user inputs and URL construction

**Location:** `src/app/(igrp)/layout.tsx:38`

**Recommendation:**

```typescript
// Validate URL construction
const resolvedBaseUrl = baseUrl || "http://localhost:3000";

try {
  const loginPath = new URL(urlLogin || "/", resolvedBaseUrl).pathname;
} catch (error) {
  console.error("[Layout] Invalid URL construction:", {
    baseUrl: resolvedBaseUrl,
    urlLogin,
    error: error instanceof Error ? error.message : String(error),
  });
  // Fallback to safe default
  const loginPath = "/login";
}
```

---

## 🟢 Best Practices & Suggestions

### 9. **Type Definitions** done 

**Recommendation:** Create shared type definitions for common patterns

```typescript
// src/types/env.d.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXTAUTH_SECRET: string;
      NEXTAUTH_URL?: string;
      NEXTAUTH_URL_INTERNAL?: string;
      KEYCLOAK_CLIENT_ID: string;
      KEYCLOAK_CLIENT_SECRET: string;
      KEYCLOAK_ISSUER: string;
      IGRP_ACCESS_MANAGEMENT_API: string;
      IGRP_APP_CODE: string;
      IGRP_PREVIEW_MODE?: "true" | "false";
      // ... other env vars
    }
  }
}

export {};
```

---

### 10. **Logging Strategy** done

**Issue:** Inconsistent logging (console.log, console.warn, console.error)

**Recommendation:** Use a structured logging library or create a logging utility

```typescript
// src/lib/logger.ts
type LogLevel = "info" | "warn" | "error" | "debug";

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(`[INFO] ${message}`, meta || "");
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(`[WARN] ${message}`, meta || "");
  },
  error: (message: string, error?: Error | unknown, meta?: Record<string, unknown>) => {
    console.error(`[ERROR] ${message}`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...meta,
    });
  },
};
```

---

### 11. **Security Improvements** done

**Recommendations:**

- Add rate limiting for auth endpoints – optional (requires Upstash)
- Implement CSRF protection ✅ (`src/lib/csrf.ts`, SECURITY.md)
- Add security headers middleware ✅ (`middleware.ts` – X-Frame-Options, etc.)
- Sanitize all user inputs ✅ (`src/lib/sanitize.ts`)
- Use secure cookie settings in production ✅ (`useSecureCookies` in auth-options)

```typescript
// src/middleware.ts - Add security headers
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Security headers
  if (process.env.NODE_ENV === "production") {
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  }
  
  // ... existing logic
  
  return response;
}
```

---

### 12. **Performance Optimizations** (done)

**Recommendations:**

- Add React.memo where appropriate
- Implement proper caching strategies
- Use Next.js Image component for all images
- Consider adding Suspense boundaries
- Optimize bundle size (check for unused imports)

---

### 13. **Testing Infrastructure**

**Missing:** No test files found

**Recommendation:** Add testing setup

- Unit tests for utilities (`utils.ts`, `get-routes.ts`)
- Integration tests for auth flow
- E2E tests for critical paths

```typescript
// Example: src/lib/__tests__/utils.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isPreviewMode, unsetEmptyEnv } from "../utils";

describe("isPreviewMode", () => {
  beforeEach(() => {
    delete process.env.IGRP_PREVIEW_MODE;
  });

  it("should return true when IGRP_PREVIEW_MODE is 'true'", () => {
    process.env.IGRP_PREVIEW_MODE = "true";
    expect(isPreviewMode()).toBe(true);
  });

  it("should handle quoted values", () => {
    process.env.IGRP_PREVIEW_MODE = '"true"';
    expect(isPreviewMode()).toBe(true);
  });
  
  // ... more tests
});
```

---

### 14. **Documentation**

**Recommendations:**

- Add JSDoc comments to all exported functions (done)
- Document complex logic (token refresh, route parsing) (done)
- Add inline comments for non-obvious code (omit)
- Create API documentation for server actions (omit)

```typescript
/**
 * Refreshes the access token using the refresh token from Keycloak.
 * 
 * @param token - The JWT token containing the refresh token
 * @returns Promise resolving to a refreshed JWT token or token with error flag
 * 
 * @throws {Error} If Keycloak configuration is missing
 * 
 * @example
 * ```ts
 * const refreshed = await refreshAccessToken(token);
 * if (refreshed.error) {
 *   // Handle refresh failure
 * }
 * ```
 */
export async function refreshAccessToken(token: JWT): Promise<JWT> {
  // ...
}
```

---

### 15. **Code Organization**

**Recommendations:**

- Group related utilities (auth helpers together)
- Consider feature-based folder structure for larger features
- Move mock data to a separate `__mocks__` or `fixtures` directory
- Create barrel exports (`index.ts`) for cleaner imports

```typescript
// src/lib/auth/index.ts
export { getAccessToken, refreshAccessToken } from "./auth-helpers";
export { authOptions } from "./auth-options";
export { serverSession, getSession } from "@/actions/igrp/auth";

// Usage: import { getAccessToken, authOptions } from "@/lib/auth";
```

---

## 📊 Priority Matrix

| Priority | Issue | Impact | Effort | File(s) |
|----------|-------|--------|--------|---------|
| 🔴 Critical | Env validation | High | Medium | Multiple |
| 🔴 Critical | Type safety (`as any`) | High | Low | `layout.ts`, `layout.tsx` |
| 🔴 Critical | Error handling | High | Medium | Multiple |
| 🟡 High | Code duplication | Medium | Low | `layout.tsx` (both) |
| 🟡 High | Magic numbers | Medium | Low | Multiple |
| 🟡 High | FS operations | Medium | Low | `get-routes.ts` |
| 🟢 Medium | Logging strategy | Low | Medium | Multiple |
| 🟢 Medium | Documentation | Low | High | All |
| 🟢 Low | Testing | Medium | High | New files |

---

## ✅ Quick Wins (Can be implemented immediately)

1. ~~**Remove `as any` type assertions**~~ – Done
2. ~~**Extract magic numbers to constants**~~ – Done
3. ~~**Consolidate preview mode checks**~~ – Done
4. ~~**Add JSDoc comments**~~ – Done
5. ~~**Fix code duplication**~~ – Done

---

## 🎯 Long-term Improvements

1. ~~**Environment validation**~~ – Done (Zod in env.ts)
2. ~~**Structured logging**~~ – Done (logger.ts)
3. **Testing infrastructure** – Set up Vitest/Jest
4. ~~**Security hardening**~~ – Done (headers, CSRF, sanitize, secure cookies)
5. **Performance monitoring** – Add analytics and monitoring (optional)

---

## 📝 Code Style Notes

- ✅ Consistent use of TypeScript
- ✅ Good use of async/await
- ✅ Proper server/client component separation
- ✅ Standardized error handling (logger, EnvValidationError)
- ✅ JSDoc on exported functions

---

## 🔗 Related Files to Review

- `SECURITY.md` – Security posture and CSRF usage
- `src/lib/sanitize.ts` – Input sanitization utilities
- `src/lib/csrf.ts` – CSRF token for custom forms
- `src/temp/` directory – Consider if mock data should be in production build
- `src/app/(igrp)/(generated)/` – Generated code, ensure it's gitignored properly
- `create-template/` – Template creation scripts, ensure they're tested

---

## Conclusion

The codebase has been significantly improved and now follows Next.js and security best practices. Implemented improvements include:

1. **Type Safety** – Proper Session typing, no `as any`
2. **Error Handling** – EnvValidationError, AuthError, structured logger
3. **Environment Validation** – Zod schema in `src/lib/env.ts`
4. **Code Organization** – setupEnvironment(), constants, env-setup
5. **Documentation** – JSDoc on exports, token refresh and route parsing docs
6. **Security** – CSRF utility, security headers, input sanitization, secure cookies
7. **Performance** – Caching (getRoutes, getSessionArgs, getPackageJson), React.memo, Suspense

**Remaining (optional):**

- Testing infrastructure (Vitest/Jest)
- Barrel exports for cleaner imports
- Rate limiting (requires Upstash Redis)

---

**Next Steps:**

1. Consider adding Vitest for unit tests (utils, get-routes)
2. Add rate limiting if deploying to production with high traffic
3. Review `src/temp/` mock data for production build exclusion
