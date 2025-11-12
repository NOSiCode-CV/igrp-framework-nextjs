import { NextResponse } from "next/server";
// import { StringFormatParams } from 'zod/v4/core';

// Enhanced error types for better type safety and error categorization
export interface ApiError extends Error {
  status: number;
  code?: string;
  details?: string;
  detail?: string;
  timestamp?: string;
  requestId?: string;
}

export interface ValidationError extends ApiError {
  type: "validation";
  field?: string;
  fieldErrors?: Record<string, string[]>;
}

export interface NetworkError extends ApiError {
  type: "network";
  endpoint?: string;
  method?: string;
}

export interface ServerError extends ApiError {
  type: "server";
  service?: string;
}

export interface ClientError extends ApiError {
  type: "client";
  action?: string;
}

// Legacy ErrorResponse from api-gateway (for backward compatibility)
export interface ErrorResponse extends Error {
  title: string;
  error: string;
  status: number;
  details: string;
  detail?: string;
  type?: string;
  instance?: string;
}

// Union type for all possible error types
export type AppError =
  | ApiError
  | ValidationError
  | NetworkError
  | ServerError
  | ClientError
  | ErrorResponse;

// Error response structure for API consumers
export interface ErrorResponseData {
  message: string;
  title?: string;
  detail?: string;
  code?: string;
  status: number;
  timestamp: string;
  requestId?: string;
  field?: string;
  fieldErrors?: Record<string, string[]>;
  type?: string;
  instance?: string;
}

// Type guards for better error type checking
export function isErrorResponse(error: unknown): error is ErrorResponse {
  return (
    error instanceof Error &&
    typeof (error as ErrorResponse).status === "number" &&
    typeof (error as ErrorResponse).title === "string"
  );
}

export function isValidationError(error: unknown): error is ValidationError {
  return (
    error instanceof Error &&
    "type" in error &&
    (error as ValidationError).type === "validation" &&
    typeof (error as ValidationError).status === "number"
  );
}

export function isNetworkError(error: unknown): error is NetworkError {
  return (
    error instanceof Error &&
    "type" in error &&
    (error as NetworkError).type === "network" &&
    typeof (error as NetworkError).status === "number"
  );
}

export function isServerError(error: unknown): error is ServerError {
  return (
    error instanceof Error &&
    "type" in error &&
    (error as ServerError).type === "server" &&
    typeof (error as ServerError).status === "number"
  );
}

export function isClientError(error: unknown): error is ClientError {
  return (
    error instanceof Error &&
    "type" in error &&
    (error as ClientError).type === "client" &&
    typeof (error as ClientError).status === "number"
  );
}

export function isApiError(error: unknown): error is ApiError {
  return (
    error instanceof Error &&
    "status" in error &&
    typeof (error as ApiError).status === "number" &&
    !("type" in error)
  );
}

// Enhanced error handler with better categorization and logging
export function handleApiError(
  error: unknown,
  requestId?: string,
): NextResponse {
  const timestamp = new Date().toISOString();

  // Enhanced logging with structured data
  console.error("API Error Details:", {
    error: error instanceof Error ? error.message : "Unknown error",
    detail: getErrorDetail(error),
    type: getErrorType(error),
    status: getErrorStatus(error),
    requestId,
    timestamp,
  });

  // Handle ValidationError
  if (isValidationError(error)) {
    return NextResponse.json(
      createErrorResponseData({
        message: error.message,
        status: error.status,
        code: error.code,
        field: error.field,
        fieldErrors: error.fieldErrors,
        type: "validation",
        timestamp,
        requestId,
      }),
      { status: error.status },
    );
  }

  // Handle NetworkError
  if (isNetworkError(error)) {
    return NextResponse.json(
      createErrorResponseData({
        message: error.message || "Network request failed",
        status: error.status,
        code: error.code || "NETWORK_ERROR",
        type: "network",
        timestamp,
        requestId,
      }),
      { status: error.status },
    );
  }

  // Handle ServerError
  if (isServerError(error)) {
    return NextResponse.json(
      createErrorResponseData({
        message: error.message || "Internal server error",
        status: error.status,
        code: error.code || "SERVER_ERROR",
        type: "server",
        timestamp,
        requestId,
      }),
      { status: error.status },
    );
  }

  // Handle ClientError
  if (isClientError(error)) {
    return NextResponse.json(
      createErrorResponseData({
        message: error.message || "Client error",
        status: error.status,
        code: error.code || "CLIENT_ERROR",
        type: "client",
        timestamp,
        requestId,
      }),
      { status: error.status },
    );
  }

  // Handle generic ApiError
  if (isApiError(error)) {
    return NextResponse.json(
      createErrorResponseData({
        message: getErrorMessage(error),
        detail: error.details || error.detail,
        status: error.status,
        code: error.code,
        timestamp,
        requestId,
      }),
      { status: error.status },
    );
  }

  // Handle generic Error
  if (error instanceof Error) {
    return NextResponse.json(
      createErrorResponseData({
        message: getErrorMessage(error),
        detail: getErrorDetail(error),
        status: 500,
        code: "INTERNAL_ERROR",
        timestamp,
        requestId,
      }),
      { status: 500 },
    );
  }

  // Handle unknown errors
  return NextResponse.json(
    createErrorResponseData({
      message: "An unexpected error occurred",
      status: 500,
      code: "UNKNOWN_ERROR",
      timestamp,
      requestId,
    }),
    { status: 500 },
  );
}

// Helper function to create standardized error response data
function createErrorResponseData(
  data: Partial<ErrorResponseData>,
): ErrorResponseData {
  return {
    message: data.message || "An error occurred",
    status: data.status || 500,
    timestamp: data.timestamp || new Date().toISOString(),
    ...data,
  };
}

// Helper functions to extract error information
function getErrorType(error: unknown): string {
  if (isValidationError(error)) return "validation";
  if (isNetworkError(error)) return "network";
  if (isServerError(error)) return "server";
  if (isClientError(error)) return "client";
  if (isErrorResponse(error)) return "api_error";
  if (isApiError(error)) return "api_error";
  return "unknown";
}

function getErrorStatus(error: unknown): number {
  if (error instanceof Error && "status" in error) {
    return (error as { status: number }).status;
  }
  return 500;
}

function getErrorDetail(error: unknown): string | undefined {
  if (isErrorResponse(error)) {
    return error.details || error.detail;
  }
  if (error instanceof Error && "details" in error) {
    return (error as { details: string }).details;
  }
  if (error instanceof Error && "detail" in error) {
    return (error as { detail: string }).detail;
  }
  return undefined;
}

function getErrorMessage(error: unknown): string {
  if (isErrorResponse(error)) {
    return error.error || error.detail || error.message;
  }
  if (error instanceof Error && "details" in error) {
    return (error as { details: string }).details || error.message;
  }
  if (error instanceof Error && "detail" in error) {
    return (error as { detail: string }).detail || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}

// Factory functions for creating specific error types
export function createValidationError(
  message: string,
  field?: string,
  fieldErrors?: Record<string, string[]>,
  status: number = 400,
): ValidationError {
  const error = new Error(message) as ValidationError;
  error.type = "validation";
  error.status = status;
  error.field = field;
  error.fieldErrors = fieldErrors;
  error.timestamp = new Date().toISOString();
  return error;
}

export function createNetworkError(
  message: string,
  endpoint?: string,
  method?: string,
  status: number = 0,
): NetworkError {
  const error = new Error(message) as NetworkError;
  error.type = "network";
  error.status = status;
  error.endpoint = endpoint;
  error.method = method;
  error.timestamp = new Date().toISOString();
  return error;
}

export function createServerError(
  message: string,
  service?: string,
  status: number = 500,
): ServerError {
  const error = new Error(message) as ServerError;
  error.type = "server";
  error.status = status;
  error.service = service;
  error.timestamp = new Date().toISOString();
  return error;
}

export function createClientError(
  message: string,
  action?: string,
  status: number = 400,
): ClientError {
  const error = new Error(message) as ClientError;
  error.type = "client";
  error.status = status;
  error.action = action;
  error.timestamp = new Date().toISOString();
  return error;
}

// Legacy function for backward compatibility
export function createApiError(
  message: string,
  status: number = 500,
): ApiError {
  const error = new Error(message) as ApiError;
  error.status = status;
  error.timestamp = new Date().toISOString();
  return error;
}
