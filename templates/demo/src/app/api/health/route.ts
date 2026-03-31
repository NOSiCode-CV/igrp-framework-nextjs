import { NextResponse } from "next/server";

/**
 * Health check endpoint for load balancers and monitoring.
 *
 * @returns JSON with status, message, and timestamp
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "Up",
      message: "Service is healthy",
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}
