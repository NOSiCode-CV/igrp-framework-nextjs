import { callGateway } from "@/app/(myapp)/utils/api-gateway";
import { handleApiError } from "@/app/(myapp)/utils/api-error-handler";
import { NextRequest, NextResponse } from "next/server";

const BASE_API_URL = process.env.NEXT_PUBLIC_BASE_API_URL;
const API_URL = `${BASE_API_URL}/attachment`;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const response = await callGateway<Blob>(`${API_URL}/${id}/download`, {
      method: "GET",
      responseType: "blob",
    });

    // Return the blob as a response
    return new NextResponse(response, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="document-${id}"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
