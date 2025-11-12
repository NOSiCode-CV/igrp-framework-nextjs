import { callServerApi } from "@/app/(myapp)/utils/server-api";
import { NextRequest } from "next/server";

const BASE_API_URL = process.env.NEXT_PUBLIC_BASE_API_URL;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain") || "";

    const API_URL = `${BASE_API_URL}/domains/${domain}/options`;

    const domainRes = await callServerApi<unknown>(API_URL, {
      method: "GET",
    });

    return Response.json(domainRes);
  } catch (error) {
    return Response.json(
      { error: `Failed to fetch domain data${error}` },
      { status: 500 },
    );
  }
}
