import { NextResponse } from 'next/server';
import { ErrorResponse } from './api-gateway';

export interface ApiError extends Error {
  status?: number;
  details?: string;
}

export function isErrorResponse(error: unknown): error is ErrorResponse {
  return (
    error instanceof Error &&
    typeof (error as ErrorResponse).status === 'number' &&
    typeof (error as ErrorResponse).title === 'string'
  );
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof Error && typeof (error as ApiError).status === 'number';
}

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  // Handle ErrorResponse from api-gateway
  if (isErrorResponse(error)) {
    return NextResponse.json(
      {
        message: error.details || error.message,
        title: error.title,
      },
      { status: error.status },
    );
  }

  // Handle ApiError with status
  if (isApiError(error)) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  // Handle generic Error
  if (error instanceof Error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  // Handle unknown errors
  return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
}

export function createApiError(message: string, status: number = 500): ApiError {
  const error = new Error(message) as ApiError;
  error.status = status;
  return error;
}
