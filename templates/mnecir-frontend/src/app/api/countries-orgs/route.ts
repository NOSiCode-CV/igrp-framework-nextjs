import { handleApiError } from "@/app/(myapp)/utils/api-error-handler";
import { callServerApi } from "@/app/(myapp)/utils/server-api";
import { NextRequest } from "next/server";

const BASE_API_URL = process.env.NEXT_PUBLIC_BASE_API_URL;

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "";

    const API_URL = `${BASE_API_URL}/country-organization/${type}`;

    const res = await callServerApi<unknown>(API_URL, {
      method: "POST",
      body: JSON.stringify(await request.json()),
    });

    return Response.json(res);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type") || "";

    const name = searchParams.get("name");
    const geographicalArea = searchParams.get("geographicalArea");
    const countryGeoId = searchParams.get("countryGeoId");
    const alertLevel = searchParams.get("alertLevel");
    const page = searchParams.get("page");
    const size = searchParams.get("size");

    const apiQueryParams = new URLSearchParams();

    if (name) apiQueryParams.append("name", name);
    if (geographicalArea)
      apiQueryParams.append("geographicalArea", geographicalArea);
    if (countryGeoId) apiQueryParams.append("countryGeoId", countryGeoId);
    if (alertLevel) apiQueryParams.append("alertLevel", alertLevel);
    if (page) apiQueryParams.append("page", page);
    if (size) apiQueryParams.append("size", size);

    const API_URL = `${BASE_API_URL}/country-organization/${type}/list?${apiQueryParams.toString()}`;

    const res = await callServerApi<unknown>(API_URL, { method: "GET" });

    return Response.json(res);
  } catch (error) {
    return handleApiError(error);
  }
}
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "";
    const id = searchParams.get("id") || "";

    const API_URL = `${BASE_API_URL}/country-organization/${type}/${id}`;

    const res = await callServerApi<unknown>(API_URL, {
      method: "PUT",
      body: JSON.stringify(await request.json()),
    });

    return Response.json(res);
  } catch (error) {
    return handleApiError(error);
  }
}
