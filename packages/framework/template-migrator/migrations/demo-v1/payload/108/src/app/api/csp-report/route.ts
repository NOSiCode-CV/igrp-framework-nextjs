import { summarizeCspReport } from "@/lib/csp-report";

// Receives Content-Security-Policy violation reports (the `report-uri` set in
// middleware.ts) and logs them, so the report-only policy produces data an
// operator can read before switching it to enforcing. Public and unauthenticated
// by nature: oversized or unsized bodies are refused before being read, a body
// that is not a CSP report gets 400, and only 3 short fields are logged.
const MAX_REPORT_BYTES = 8 * 1024;

export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length"));
  if (!length || length > MAX_REPORT_BYTES) {
    return new Response(null, { status: 413 });
  }
  const report = summarizeCspReport(await request.text());
  if (!report) return new Response(null, { status: 400 });
  // JSON-quoted, so a value with newlines can't forge extra log lines.
  console.warn("[csp-report]", JSON.stringify(report));
  return new Response(null, { status: 204 });
}
