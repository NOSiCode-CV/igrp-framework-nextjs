import { handleApiError } from "@/app/(myapp)/utils/api-error-handler";
import { callGeoApi } from "@/app/(myapp)/utils/geo-api";
import { NextRequest } from "next/server";

const BASE_API_URL = process.env.NEXT_PUBLIC_GEOGRAPHY_BASE_API_URL;

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "0";

    const API_URL = `${BASE_API_URL}?id=${id}`;

    const geography = await callGeoApi<unknown>(API_URL, {
      method: "POST",
      body: JSON.stringify({
        GET_GEOGRAFIA_NIVEL: {
          id,
        },
      }),
    });

    return Response.json(geography);
  } catch (error) {
    return handleApiError(error);
  }
}
