import { handleApiError } from "@/app/(myapp)/utils/api-error-handler";
import { callServerApi } from "@/app/(myapp)/utils/server-api";
import { NextRequest } from "next/server";

const BASE_API_URL = process.env.NEXT_PUBLIC_BASE_API_URL;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type") || "";
    const organizationId = searchParams.get("organizationId") || "";
    const alertLevel = searchParams.get("alertLevel");
    const countryName = searchParams.get("countryName");

    let API_URL = `${BASE_API_URL}/country-organization/${type}/${organizationId}/members`;

    const queryParams = new URLSearchParams();
    if (alertLevel) {
      queryParams.append("alertLevel", alertLevel);
    }
    if (countryName) {
      queryParams.append("countryName", countryName);
    }

    if (queryParams.toString()) {
      API_URL += `?${queryParams.toString()}`;
    }

    const res = await callServerApi<unknown>(API_URL, { method: "GET" });

    return Response.json(res);
  } catch (error) {
    return handleApiError(error);
  }
}
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "";
    const orgId = searchParams.get("organizationId") || "";

    const API_URL = `${BASE_API_URL}/country-organization/${type}/${orgId}/members`;

    const res = await callServerApi<unknown>(API_URL, {
      method: "POST",
      body: JSON.stringify(await request.json()),
    });

    return Response.json(res);
  } catch (error) {
    return Response.json(
      { error: `Failed to add data	${error}` },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "";
    const orgId = searchParams.get("organizationId") || "";
    const memberId = searchParams.get("memberId") || "";

    const API_URL = `${BASE_API_URL}/country-organization/${type}/${orgId}/members/${memberId}`;

    const res = await callServerApi<unknown>(API_URL, {
      method: "PUT",
      body: JSON.stringify(await request.json()),
    });

    return Response.json(res);
  } catch (error) {
    return handleApiError(error);
  }
}
