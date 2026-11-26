import { expect, test } from "playwright/test";

// The nested-callbackUrl login loop (NEXTAUTH_URL without basePath + /api/auth)
// shows up here as a second callbackUrl or a Location outside the basePath.
test("anonymous request to a protected route redirects to {basePath}/login once", async ({
  request,
}) => {
  const response = await request.get("./reports", { maxRedirects: 0 });
  expect(response.status()).toBe(307);

  const location = new URL(response.headers().location ?? "", "http://x");
  expect(location.pathname).toBe("/apps/template/login");
  expect(location.searchParams.getAll("callbackUrl")).toEqual(["/reports"]);
});
