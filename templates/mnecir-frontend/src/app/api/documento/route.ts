import { handleApiError } from "@/app/(myapp)/utils/api-error-handler";
// import { callServerApi } from '@/app/(myapp)/utils/server-api';
import { callGateway } from "@/app/(myapp)/utils/api-gateway";
import { NextRequest, NextResponse } from "next/server";
import { Documento } from "@/app/(myapp)/types/accord";
import { DocumentoUploadResponse } from "@/app/(myapp)/functions/documento";

const BASE_API_URL = process.env.NEXT_PUBLIC_BASE_API_URL;
const API_URL = `${BASE_API_URL}/attachment`;

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("fileId");

    if (!id) {
      return NextResponse.json(
        { error: "fileId parameter is required" },
        { status: 400 },
      );
    }

    const response = await callGateway<Documento>(`${API_URL}?fileId=${id}`, {
      method: "GET",
    });

    // 4. Redirecionar para o documento
    return NextResponse.redirect(response.url);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Erro ao buscar documento", message: (error as Error).message },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get the FormData from the request
    const formData = await req.formData();

    const folder = "/Acordo";

    // Forward the FormData to the backend service
    const response = await callGateway<DocumentoUploadResponse>(
      `${API_URL}${folder}`,
      {
        method: "POST",
        body: formData,
      },
    );

    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error);
  }
}
