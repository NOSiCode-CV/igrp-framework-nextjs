import { type APIRequestContext, expect, test } from "playwright/test";

import { AUTH_ISSUER, AUTH_ORIGIN, BASE_PATH } from "../playwright.auth.config";

const APP = `${AUTH_ORIGIN}${BASE_PATH}`;
const MAX_HOPS = 5;

/**
 * Follows redirects by hand from `url` until a response is not a redirect or
 * the URL leaves the app (origin + basePath), which is not requested. Every in-app hop must keep
 * the basePath and carry at most one, non-login callbackUrl: a wrong
 * NEXTAUTH_URL shows up as a hop outside the basePath or a nested
 * `?callbackUrl=…?callbackUrl=…` chain. Returns the final URL and whether it
 * left the app.
 */
async function walk(request: APIRequestContext, url: string) {
  let current = new URL(url, `${APP}/`);
  for (let hop = 0; hop < MAX_HOPS; hop++) {
    if (!current.href.startsWith(`${APP}/`) && current.href !== APP) {
      return { url: current, external: true };
    }
    const callbackUrls = current.searchParams.getAll("callbackUrl");
    expect(callbackUrls.length, `hop to ${current.href}`).toBeLessThanOrEqual(1);
    expect(callbackUrls[0] ?? "", `hop to ${current.href}`).not.toContain("callbackUrl");
    expect(callbackUrls[0] ?? "", `hop to ${current.href}`).not.toMatch(/\/login/);

    const response = await request.get(current.href, { maxRedirects: 0 });
    if (response.status() < 300 || response.status() >= 400) {
      expect(response.status(), `GET ${current.href}`).toBe(200);
      return { url: current, external: false };
    }
    current = new URL(response.headers().location ?? "", current);
  }
  throw new Error(`more than ${MAX_HOPS} redirects, last ${current.href}`);
}

test("anonymous request to a protected route redirects to {basePath}/login once", async ({
  request,
}) => {
  const response = await request.get("./reports", { maxRedirects: 0 });
  expect(response.status()).toBe(307);

  const location = new URL(response.headers().location ?? "", "http://x");
  expect(location.pathname).toBe(`${BASE_PATH}/login`);
  expect(location.searchParams.getAll("callbackUrl")).toEqual(["/reports"]);
});

// The whole login round-trip up to the IdP, as the browser makes it. The
// stub issuer only serves discovery; the authorize URL is never requested.
test("login chain ends at the issuer's authorize URL with a redirect_uri inside the basePath", async ({
  request,
}) => {
  // First hit compiles /login and the NextAuth route: ~35s cold under Turbopack.
  test.slow();
  const login = await walk(request, "./reports");
  expect(login.external, `stopped at ${login.url.href}`).toBe(false);
  expect(login.url.pathname).toBe(`${BASE_PATH}/login`);
  expect(login.url.searchParams.getAll("callbackUrl")).toEqual(["/reports"]);

  // What the login button's signIn("igrp-auth") does: the client's NextAuth
  // basePath is `${NEXT_PUBLIC_BASE_PATH}/api/auth` (get-session-args.ts).
  const csrf = await request.get(`${APP}/api/auth/csrf`);
  expect(csrf.status()).toBe(200);
  const { csrfToken } = await csrf.json();
  const signIn = await request.post(`${APP}/api/auth/signin/igrp-auth`, {
    form: { csrfToken, callbackUrl: "/reports", json: "true" },
    maxRedirects: 0,
  });
  expect(signIn.status()).toBe(200);
  const { url } = await signIn.json();

  const end = await walk(request, url);
  expect(end.external, `chain stayed in the app, ended at ${end.url.href}`).toBe(true);
  expect(`${end.url.origin}${end.url.pathname}`).toBe(`${AUTH_ISSUER}/oauth2/authorize`);
  // The IdP sends the code back here; anything else lands outside NextAuth's
  // callback route (a 404 outside the basePath, or the middleware bouncing it
  // to /login with the callback as callbackUrl — the loop).
  expect(end.url.searchParams.get("redirect_uri")).toBe(`${APP}/api/auth/callback/igrp-auth`);
});
