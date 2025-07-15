import { Declaracao } from '@/app/(myapp)/types/declaracao';
import { callGateway } from '@/app/(myapp)/lib/api-gateway';
import { handleApiError } from '@/app/(myapp)/lib/api-error-handler';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ uuid: string }> }) {
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