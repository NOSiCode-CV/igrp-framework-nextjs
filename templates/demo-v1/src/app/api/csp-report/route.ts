// Receives Content-Security-Policy violation reports (the `report-uri` set in
// middleware.ts) and logs them, so the report-only policy produces data an
// operator can read before switching it to enforcing. Public and unauthenticated
// by nature: oversized or unsized bodies are refused before being read, and a
// report is only logged, never stored or echoed.
const MAX_REPORT_BYTES = 8 * 1024;

export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length"));
  if (!length || length > MAX_REPORT_BYTES) {
    return new Response(null, { status: 413 });
  }
  console.warn("[csp-report]", await request.text());
  return new Response(null, { status: 204 });
}
