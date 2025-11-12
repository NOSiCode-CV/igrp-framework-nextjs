"use server";

interface ExtendedRequestInit extends RequestInit {
  isTextResponse?: boolean;
  responseType?: "json" | "text" | "blob";
}

export interface ErrorResponse extends Error {
  title: string;
  status: number;
  details: string;
  detail: string;
  type?: string;
  instance?: string;
}

export async function callServerApi<T>(
  endpoint: string,
  options: ExtendedRequestInit = {},
): Promise<T> {
  const baseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    //"Authorization": `Bearer ${session.accessToken}`,
    ...((options.headers as Record<string, string>) || {}),
  };

  // Remove Content-Type for FormData
  if (options.body instanceof FormData) {
    delete baseHeaders["Content-Type"];
  }

  const response = await fetch(endpoint, {
    ...options,
    headers: baseHeaders,
  });

  if (!response.ok) {
    const errorData = (await response
      .json()
      .catch(() => ({}))) as ErrorResponse;
    const errorMessage = `API Error (${errorData.title || "Unknown Error"} ${errorData.status})`;

    // Create a proper ErrorResponse object with all fields
    const error = new Error(errorData.details || errorMessage) as ErrorResponse;
    error.title = errorData.title || "API Error";
    error.status = errorData.status || response.status;
    error.details = errorMessage;
    error.type = errorData.type || "api_error";
    error.instance = errorData.instance || endpoint;

    throw error;
  }

  // Handle different response types
  if (options.responseType === "blob") {
    return (await response.blob()) as unknown as T;
  }

  if (options.responseType === "text" || options.isTextResponse) {
    return (await response.text()) as unknown as T;
  }

  // Handle 204 No Content (delete operations) or empty responses
  if (
    response.status === 204 ||
    response.headers.get("content-length") === "0"
  ) {
    return {} as T;
  }

  return (await response.json()) as T;
}
