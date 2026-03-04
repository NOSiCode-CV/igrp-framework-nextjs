# Security

## CSRF Protection

### Auth Flows (NextAuth)

NextAuth provides built-in CSRF protection for all authentication flows:

- **Sign in / Sign out** – Uses `next-auth.csrf-token` cookie with cryptographic validation
- **OAuth callbacks** – Validated via state parameter and PKCE
- **Session** – Protected by same-origin and cookie policies

No additional configuration is required for auth endpoints.

### Server Actions

Next.js Server Actions are protected by default:

- Only **same-origin** requests are accepted
- Origin/Host header validation prevents cross-site invocation
- Configure `serverActions.allowedOrigins` in `next.config.ts` if using a proxy or multiple domains

### Custom Forms

For custom forms (e.g. contact, settings) that perform state changes, use the CSRF utility:

```tsx
// Server Component - render form with token
import { createCsrfToken, CSRF_FIELD_NAME } from "@/lib/csrf";

export default async function MyForm() {
  const csrfToken = await createCsrfToken();
  return (
    <form action={submitAction}>
      <input type="hidden" name={CSRF_FIELD_NAME} value={csrfToken} />
      {/* ... other fields */}
    </form>
  );
}

// Server Action - validate before processing
import { validateCsrfToken } from "@/lib/csrf";

export async function submitAction(formData: FormData) {
  const token = formData.get("csrf_token");
  if (!(await validateCsrfToken(token as string))) {
    throw new Error("Invalid CSRF token");
  }
  // ... process form
}
```

## Input Sanitization

User input is sanitized before use to prevent injection and open redirect attacks:

- **Redirect URLs** (`sanitizeRedirectUrl`) – Login `callbackUrl`, auth redirect callback. Allows only relative paths or same-origin URLs; rejects `javascript:`, `data:`, path traversal.
- **Paths** (`sanitizePath`) – Home redirect, path params. Ensures starts with `/`, no `..`.
- **Strings** (`sanitizeString`) – General input: trims, limits length, strips control chars.
- **HTML** (`escapeHtml`) – Use when rendering raw HTML from user content.

See `src/lib/sanitize.ts` for the utility and usage.

## Other Security Measures

- **Rate limiting** – Auth endpoints are rate-limited (see `src/lib/rate-limit.ts`)
- **Security headers** – Applied in middleware to all responses (pages + API routes):
  - `X-Content-Type-Options: nosniff` – Prevents MIME sniffing
  - `X-Frame-Options: DENY` – Prevents clickjacking
  - `X-XSS-Protection: 1; mode=block` – XSS filter
  - `Referrer-Policy: strict-origin-when-cross-origin` – Limits referrer data
  - `Permissions-Policy` – Restricts camera, microphone, geolocation, FLoC
- **Secure cookies** – `useSecureCookies` enabled in production
