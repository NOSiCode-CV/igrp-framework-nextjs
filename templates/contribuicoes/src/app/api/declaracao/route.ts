import { PaginatedResponse } from '@/app/(myapp)/types';
import { Declaracao } from '@/app/(myapp)/types/declaracao';
import { callGateway } from '@/app/(myapp)/lib/api-gateway';
import { handleApiError } from '@/app/(myapp)/lib/api-error-handler';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_GATEWAY ?? '';
    const SERVICE_ID = process.env.NEXT_PUBLIC_SERVICE_ID ?? '';
    const query = req.nextUrl.searchParams.get('query') ?? '';
    const declaracaoId = req.nextUrl.searchParams.get('declaracaoId') ?? '';

    // If declaracaoId is provided, fetch specific contributor
    if (declaracaoId) {
      console.log('DeclaracaoId: ', declaracaoId);
      const response = await callGateway<Declaracao>(
        `${API_URL}/${SERVICE_ID}/api/v1/declaracoes/${declaracaoId}?${query}`,
        {
          method: 'GET',
        },
      );
      return NextResponse.json(response);
    }

    // Otherwise, fetch paginated list
    const response = await callGateway<PaginatedResponse<Declaracao>>(
      `${API_URL}/${SERVICE_ID}/api/v1/declaracoes${query}`,
      {
        method: 'GET',
      },
    );

    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const API_URL = process.env.NEXT_PUBLIC_API_GATEWAY ?? '';
    const SERVICE_ID = process.env.NEXT_PUBLIC_SERVICE_ID ?? '';

    const response = await callGateway<Declaracao>(`${API_URL}/${SERVICE_ID}/api/v1/declaracoes`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    console.log('response', response);
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ uuid: string }> }) {
  try {
    const { uuid } = await params;
    const API_URL = process.env.NEXT_PUBLIC_API_GATEWAY ?? '';
    const SERVICE_ID = process.env.NEXT_PUBLIC_SERVICE_ID ?? '';
    const body = await request.json();

    const response = await callGateway<Declaracao>(
      `${API_URL}/${SERVICE_ID}/api/v1/declaracoes/${uuid}`,
      {
        method: 'PUT',
        body: JSON.stringify(body),
      },
    );

    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error);
  }
}
