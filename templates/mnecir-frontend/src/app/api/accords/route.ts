import { handleApiError } from "@/app/(myapp)/utils/api-error-handler";
import { callServerApi } from "@/app/(myapp)/utils/server-api";
import { NextRequest, NextResponse } from "next/server";

const BASE_API_URL = process.env.NEXT_PUBLIC_BASE_API_URL;

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.toString();

    const id = request.nextUrl.searchParams.get("id") || "";
    if (id) {
      const API_URL = `${BASE_API_URL}/accord/${id}`;

      const res = await callServerApi<unknown>(API_URL, {
        method: "GET",
      });

      return NextResponse.json(res);
    }

    const API_URL = `${BASE_API_URL}/accord?${query}`;

    console.log("API_URL", API_URL);

    const accordRes = await callServerApi<unknown>(API_URL, {
      method: "GET",
    });

    return NextResponse.json(accordRes);
  } catch (error) {
    return Response.json(
      { error: `Failed to fetch accord data ${error}` },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const API_URL = `${BASE_API_URL}/accord`;

    const res = await callServerApi<unknown>(API_URL, {
      method: "POST",
      body: JSON.stringify(await request.json()),
    });

    return NextResponse.json(res);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();

    const API_URL = `${BASE_API_URL}/accord/${data.id}`;

    const res = await callServerApi<unknown>(API_URL, {
      method: "PUT",
      body: JSON.stringify(data),
    });

    return NextResponse.json(res);
  } catch (error) {
    return handleApiError(error);
  }
}
