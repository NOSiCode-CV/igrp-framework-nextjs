/*export async function callApi<T>(url: string, options: RequestInit = {}): Promise<T> {
	const res = await fetch(url, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...(options.headers || {}),
		},
	});

	if (!res.ok) {
		throw new Error(`API error: ${res.status}`);
	}

	return res.json();
}*/

"use client";

export interface ApiError extends Error {
  status: number;
  code?: string;
  details?: string;
  detail?: string;
  title?: string;
  timestamp?: string;
}

interface ExtendedRequestInit extends RequestInit {
  isTextResponse?: boolean;
  responseType?: "json" | "text" | "blob";
}

export async function callApi<T>(
  endpoint: string,
  options: ExtendedRequestInit = {},
): Promise<T> {
  // Safely resolve base path
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const fullEndpoint = basePath ? `${basePath}${endpoint}` : endpoint;

  const baseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  // Remove Content-Type for FormData
  if (options.body instanceof FormData) {
    delete baseHeaders["Content-Type"];
  }

  const response = await fetch(fullEndpoint, {
    ...options,
    headers: baseHeaders,
  });

  if (!response.ok) {
    let errorBody;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = {};
    }

    const error = new Error(
      errorBody.message || errorBody.detail || `API Error (${response.status})`,
    ) as ApiError;

    error.status = errorBody.status || response.status;
    error.code = errorBody.code;
    error.details = errorBody.details || errorBody.detail || errorBody.message;
    error.detail = errorBody.detail || errorBody.details;
    error.title = errorBody.title || "API Error";
    error.timestamp = errorBody.timestamp;

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
