import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
} from "next/constants";

import { describe, expect, it } from "vitest";

import createConfig from "../../next.config";

// The fixed security headers live in next.config `headers()` so they reach
// every path, including the ones the middleware matcher skips.
describe("next.config security headers", () => {
  it("sets the fixed headers on every path in production", async () => {
    const rules =
      (await createConfig(PHASE_PRODUCTION_BUILD).headers?.()) ?? [];
    expect(rules).toHaveLength(1);
    expect(rules[0]?.source).toBe("/:path*");
    const headers = Object.fromEntries(
      rules[0]?.headers.map(({ key, value }) => [key, value]) ?? [],
    );
    expect(headers).toMatchObject({
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "0",
    });
    expect(headers["Strict-Transport-Security"]).toMatch(
      /^max-age=\d+; includeSubDomains$/,
    );
  });

  it("sends none from the dev server", async () => {
    expect(await createConfig(PHASE_DEVELOPMENT_SERVER).headers?.()).toEqual(
      [],
    );
  });
});
