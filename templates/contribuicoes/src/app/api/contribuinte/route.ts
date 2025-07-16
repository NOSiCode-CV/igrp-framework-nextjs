import { PaginatedResponse } from '@/app/(myapp)/types';
import { Contribuinte } from '@/app/(myapp)/types/contribuinte';
import { callGateway } from '@/app/(myapp)/lib/api-gateway';
import { handleApiError } from '@/app/(myapp)/lib/api-error-handler';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_GATEWAY ?? '';
    const query = req.nextUrl.searchParams.get('query') ?? '';
    const contribuinteId = req.nextUrl.searchParams.get('contribuinteId') ?? '';

    // If contribuinteId is provided, fetch specific contributor
    if (contribuinteId) {
      const response = await callGateway<Contribuinte>(
        `${API_URL}/cadastro-service/contribuinte/${contribuinteId}?${query}`,
        {
          method: 'GET',
        },
      );
      return NextResponse.json(response);
    }

    // Otherwise, fetch paginated list
    const response = await callGateway<PaginatedResponse<Contribuinte>>(
      `${API_URL}/cadastro-service/contribuinte?${query}`,
      {
        method: 'GET',
      },
    );

    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error);
  }
}
