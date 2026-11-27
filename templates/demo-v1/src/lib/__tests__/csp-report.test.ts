import { describe, expect, it } from "vitest";

import { summarizeCspReport } from "../csp-report";

describe("summarizeCspReport", () => {
  it("reads the report-uri shape", () => {
    const body = JSON.stringify({
      "csp-report": {
        "document-uri": "https://app.test/page",
        "violated-directive": "script-src-elem",
        "blocked-uri": "https://evil.test/x.js",
        "script-sample": "ignored",
      },
    });
    expect(summarizeCspReport(body)).toEqual({
      document: "https://app.test/page",
      directive: "script-src-elem",
      blocked: "https://evil.test/x.js",
    });
  });

  it("reads the Reporting API shape", () => {
    const body = JSON.stringify([
      {
        type: "csp-violation",
        body: {
          documentURL: "https://app.test/",
          effectiveDirective: "img-src",
          blockedURL: "data",
        },
      },
    ]);
    expect(summarizeCspReport(body)).toEqual({
      document: "https://app.test/",
      directive: "img-src",
      blocked: "data",
    });
  });

  it("cuts each field to 200 characters", () => {
    const body = JSON.stringify({
      "csp-report": { "violated-directive": "x".repeat(5000) },
    });
    expect(summarizeCspReport(body)?.directive).toHaveLength(200);
  });

  it("rejects a body that is not a CSP report", () => {
    expect(summarizeCspReport("hello")).toBeNull();
    expect(summarizeCspReport("null")).toBeNull();
    expect(summarizeCspReport('{"a":1}')).toBeNull();
    expect(summarizeCspReport('{"csp-report":{"blocked-uri":"x"}}')).toBeNull();
    expect(summarizeCspReport("[]")).toBeNull();
  });
});
