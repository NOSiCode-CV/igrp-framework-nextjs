/**
 * Reads a CSP violation report into the 3 fields worth logging, or `null` when
 * the body is not a report. Accepts the `report-uri` shape
 * (`{"csp-report": {...}}`) and the Reporting API shape (`[{ body: {...} }]`).
 * Each value is cut to 200 characters, so a public endpoint cannot fill the log.
 */
export type CspReportSummary = {
  document: string;
  directive: string;
  blocked: string;
};

const MAX_FIELD = 200;

export function summarizeCspReport(raw: string): CspReportSummary | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  const body = Array.isArray(parsed)
    ? (parsed[0] as { body?: unknown } | undefined)?.body
    : (parsed as { "csp-report"?: unknown } | null)?.["csp-report"];
  if (!body || typeof body !== "object") return null;
  const r = body as Record<string, unknown>;
  const field = (...keys: string[]) => {
    const value = keys.map((k) => r[k]).find((v) => typeof v === "string");
    return typeof value === "string" ? value.slice(0, MAX_FIELD) : "";
  };
  const summary = {
    document: field("document-uri", "documentURL"),
    directive: field(
      "effective-directive",
      "violated-directive",
      "effectiveDirective",
    ),
    blocked: field("blocked-uri", "blockedURL"),
  };
  return summary.directive ? summary : null;
}
