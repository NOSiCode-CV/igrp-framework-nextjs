import { ParameterizationOption } from '@/app/(myapp)/types';
import { callGateway } from '@/app/(myapp)/lib/api-gateway';
import { handleApiError } from '@/app/(myapp)/lib/api-error-handler';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_GATEWAY ?? '';
    const SERVICE_ID = process.env.NEXT_PUBLIC_SERVICE_ID ?? '';
    const response = await callGateway<ParameterizationOption[]>(
      `${API_URL}/${SERVICE_ID}/${req.nextUrl.searchParams.get('name')}`,
      {
        method: 'GET',
      },
    );

    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error);
  }
}
