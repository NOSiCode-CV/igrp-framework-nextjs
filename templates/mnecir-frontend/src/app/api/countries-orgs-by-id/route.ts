import { handleApiError } from "@/app/(myapp)/utils/api-error-handler";
import { callServerApi } from "@/app/(myapp)/utils/server-api";
import { NextRequest } from "next/server";

const BASE_API_URL = process.env.NEXT_PUBLIC_BASE_API_URL;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "";
    const id = searchParams.get("id") || "";

    const API_URL = `${BASE_API_URL}/country-organization/${type}/${id}`;

    const res = await callServerApi<unknown>(API_URL, {
      method: "GET",
    });

    return Response.json(res);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "";
    const id = searchParams.get("id") || "";
    const action = searchParams.get("action") || "";

    const API_URL = `${BASE_API_URL}/country-organization/${type}/${id}/${action}`;

    const res = await callServerApi<unknown>(API_URL, {
      method: "PATCH",
      body: JSON.stringify(await request.json()),
    });

    return Response.json(res);
  } catch (error) {
    return handleApiError(error);
  }
}
