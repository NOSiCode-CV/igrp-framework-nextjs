import { callGeoApi } from "@/app/(myapp)/utils/geo-api";
import { NextRequest, NextResponse } from "next/server";

const BASE_API_URL = process.env.NEXT_PUBLIC_BASE_API_URL;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code") || "EUR";

    const API_URL = `${BASE_API_URL}/country-organization/countries-map/${code}`;

    const countries = await callGeoApi<unknown>(API_URL, {
      method: "GET",
    });

    return NextResponse.json(countries);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch countries data";
    return NextResponse.json(
      {
        error: "Failed to fetch countries data",
        message: errorMessage,
      },
      { status: 500 },
    );
  }
}
