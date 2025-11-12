# Migration Guide

This document outlines the modifications made to implement preview mode functionality and improve the application's error handling.

## Table of Contents

1. [Preview Mode Implementation](#preview-mode-implementation)
2. [Custom Not Found Page](#custom-not-found-page)
3. [Environment Variables Documentation](#environment-variables-documentation)

---

## Preview Mode Implementation

### Overview
Implemented a preview mode feature that allows the application to run without authentication checks when `IGRP_PREVIEW_MODE=true` is set. This is useful for development, demos, and testing scenarios.

### Changes Made

#### 1. Middleware (`src/middleware.ts`)

**Before:**
- Authentication checks were always performed for non-public paths
- Token validation happened on every request

**After:**
- Added preview mode check at the beginning of middleware
- Skips all authentication checks when `IGRP_PREVIEW_MODE=true`
- Only validates tokens when preview mode is disabled

**Key Changes:**
```typescript
// Skip authentication checks if preview mode is enabled
const rawValue = process.env.IGRP_PREVIEW_MODE;
const previewModeValue = rawValue?.trim()?.replace(/^["']|["']$/g, '')?.toLowerCase();
const isPreviewMode = previewModeValue === 'true';

if (!isPreviewMode) {
  // Authentication checks only run when preview mode is disabled
  if (isPublicPath(pathname)) return NextResponse.next();
  const token = await getToken({ req: request });
  // ... token validation
}
```

**Benefits:**
- Allows development without Keycloak setup
- Prevents redirects to `/login` in preview mode
- Handles whitespace, case variations, and quoted values

---

#### 2. Layout Configuration (`src/actions/igrp/layout.ts`)

**Before:**
- Always attempted to retrieve access token
- Returned `null` for session when token retrieval failed

**After:**
- Checks preview mode before attempting token retrieval
- Provides a mock session object in preview mode to prevent client-side redirects
- Skips token retrieval entirely when preview mode is enabled

**Key Changes:**
```typescript
const isPreviewMode = previewModeValue === 'true';

// In preview mode, provide a mock session object to prevent client-side redirects
const session = isPreviewMode 
  ? { 
      user: { name: 'Preview User', email: 'preview@example.com' },
      accessToken: 'preview-token',
      expires: '9999-12-31T23:59:59.999Z'
    } as any
  : await getAccessToken();
```

**Benefits:**
- Prevents framework from detecting missing session
- Satisfies IGRP framework's session requirements
- Avoids unnecessary Keycloak API calls in preview mode

---

#### 3. IGRP Layout (`src/app/(igrp)/layout.tsx`)

**Before:**
- Only checked `previewMode` from config
- Could redirect to `/login` if session was null

**After:**
- Checks preview mode from both environment variable and config
- Skips redirect to `/login` when preview mode is enabled
- Uses robust environment variable parsing

**Key Changes:**
```typescript
// Check preview mode directly from environment variable as well
const rawValue = process.env.IGRP_PREVIEW_MODE;
const previewModeValue = rawValue?.trim()?.replace(/^["']|["']$/g, '')?.toLowerCase();
const envPreviewMode = previewModeValue === 'true';
const isPreviewMode = envPreviewMode || previewMode;

if (!isPreviewMode && session === null && urlLogin && !isAlreadyOnLogin) {
  redirect(urlLogin);
}
```

**Benefits:**
- Double-check ensures preview mode is respected
- Handles edge cases where config might not propagate correctly
- Prevents authentication redirects in preview mode

---

#### 4. Template Configuration (`src/igrp.template.config.ts`)

**Before:**
- Session refetching was always enabled
- Could trigger client-side authentication checks

**After:**
- Disables session refetching in preview mode
- Sets `refetchInterval: 0` and `refetchOnWindowFocus: false` when preview mode is enabled
- Prevents client-side session checks from triggering redirects

**Key Changes:**
```typescript
sessionArgs: (() => {
  const rawValue = process.env.IGRP_PREVIEW_MODE;
  const previewModeValue = rawValue?.trim()?.replace(/^["']|["']$/g, '')?.toLowerCase();
  const isPreviewMode = previewModeValue === 'true';
  
  if (isPreviewMode) {
    return {
      refetchInterval: 0, // Disable refetching
      refetchOnWindowFocus: false, // Disable refetching on focus
      basePath: basePath(process.env.NEXT_PUBLIC_BASE_PATH || ''),
    };
  }
  
  return {
    refetchInterval: 5 * 60,
    refetchOnWindowFocus: true,
    basePath: basePath(process.env.NEXT_PUBLIC_BASE_PATH || ''),
  };
})(),
```

**Benefits:**
- Prevents client-side session polling
- Stops automatic redirects triggered by session checks
- Reduces unnecessary network requests

---

## Custom Not Found Page

### Overview
Implemented a global custom 404 page that works for all unmatched routes in the application.

### Changes Made

#### 1. Root-Level Not Found Page (`src/app/not-found.tsx`)

**Created:**
- New file at root `app` directory level
- Uses IGRP template component for consistent styling
- Includes metadata export for SEO

**Key Features:**
```typescript
import type { Metadata } from "next";
import { IGRPTemplateNotFound } from "@igrp/framework-next-ui";

export const metadata: Metadata = {
  title: "404 - Página não encontrada",
  description: "A página que você está procurando não foi encontrada.",
};

export default function NotFound() {
  const appCode = process.env.IGRP_APP_CODE || "";
  return <IGRPTemplateNotFound appCode={appCode} />;
}
```

**Why Root Level:**
- Previous `not-found.tsx` was inside `(igrp)` route group
- Route group `not-found.tsx` only applies to routes within that group
- Root-level `not-found.tsx` handles all unmatched routes globally

---

#### 2. Catch-All Route (`src/app/[...not-found]/page.tsx`)

**Created:**
- Catch-all dynamic route to ensure unmatched routes trigger `notFound()`
- Acts as a fallback mechanism

**Key Features:**
```typescript
import { notFound } from "next/navigation";

export default function CatchAllNotFound() {
  notFound();
}
```

**Purpose:**
- Ensures all unmatched routes explicitly call `notFound()`
- Guarantees custom not-found page is displayed
- Works as a safety net for edge cases

---

## Environment Variables Documentation

### Overview
Enhanced `.env.examples` file with comprehensive comments explaining each environment variable.

### Changes Made

#### Updated `.env.examples`

**Added:**
- Section headers grouping related variables
- Detailed comments for each variable explaining:
  - What the variable does
  - Example values
  - How to obtain/set the value
  - Special notes and considerations

**Sections:**
1. **Authentication Configuration (Keycloak)**
   - `KEYCLOAK_CLIENT_ID`
   - `KEYCLOAK_CLIENT_SECRET`
   - `KEYCLOAK_ISSUER`

2. **NextAuth Configuration**
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET` (includes generation commands)
   - `NEXTAUTH_URL_INTERNAL`

3. **IGRP Framework Configuration**
   - `IGRP_APP_MANAGER_API`
   - `IGRP_APP_CODE`
   - `IGRP_PREVIEW_MODE` (detailed explanation of true/false values)

4. **Next.js Public Configuration**
   - `NEXT_IGRP_APP_CENTER_URL`
   - `NEXT_PUBLIC_BASE_PATH`
   - `NEXT_PUBLIC_IGRP_APP_HOME_SLUG`
   - `NEXT_PUBLIC_ALLOWED_DOMAINS`

**Benefits:**
- Easier onboarding for new developers
- Clear documentation of required variables
- Examples help users understand expected formats
- Reduces configuration errors

---

## Migration Steps

### To Enable Preview Mode

1. **Set Environment Variable:**
   ```bash
   IGRP_PREVIEW_MODE=true
   ```
   Or add to `.env.local`:
   ```
   IGRP_PREVIEW_MODE=true
   ```

2. **Restart Development Server:**
   ```bash
   pnpm dev
   ```

3. **Verify:**
   - Access home page without authentication
   - No redirects to `/login`
   - Application loads normally

### To Disable Preview Mode

1. **Set Environment Variable:**
   ```bash
   IGRP_PREVIEW_MODE=false
   ```
   Or remove the variable entirely

2. **Restart Development Server**

3. **Verify:**
   - Authentication checks are active
   - Unauthenticated users redirect to `/login`
   - Session validation works correctly

---

## Testing

### Preview Mode Testing

1. Set `IGRP_PREVIEW_MODE=true`
2. Access any route without authentication
3. Verify no redirects occur
4. Check console logs for preview mode detection

### Not Found Page Testing

1. Access a non-existent route (e.g., `/test-404`)
2. Verify custom 404 page displays
3. Check that IGRP template component renders correctly
4. Test navigation links work

---

## Files Modified

- `src/middleware.ts`
- `src/actions/igrp/layout.ts`
- `src/app/(igrp)/layout.tsx`
- `src/igrp.template.config.ts`

## Files Created

- `src/app/not-found.tsx`
- `src/app/[...not-found]/page.tsx`
- `.env.examples` (updated with comments)

---

## Notes

- Preview mode is case-insensitive and handles quoted values
- Preview mode works at both server-side (middleware, layouts) and client-side (framework checks)
- Mock session object prevents framework from detecting missing authentication
- Root-level `not-found.tsx` is required for global 404 handling
- Catch-all route ensures all unmatched routes trigger the not-found page

---

## Version Information

- **Next.js Version:** 15.5.6
- **App Router:** Enabled
- **Migration Date:** 2025-01-XX

