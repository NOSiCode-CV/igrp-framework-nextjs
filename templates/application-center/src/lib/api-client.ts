// interface FetchOptions extends RequestInit {
//   token?: string
// }

// function normalizeHeaders(headers: HeadersInit | undefined): Record<string, string> {
//   if (!headers) return {}
//   if (headers instanceof Headers) {
//     const result: Record<string, string> = {}
//     headers.forEach((value, key) => {
//       result[key] = value
//     })
//     return result
//   }
//   if (Array.isArray(headers)) {
//     return Object.fromEntries(headers)
//   }
//   return headers
// }

// export async function fetchFromApi(
//   api: string,
//   path: string,
//   options: FetchOptions = {},
// ) {
//   const url = `${api}${path}`

//   const baseHeaders: Record<string, string> = {
//     ...normalizeHeaders(options.headers),
//   }

//   if (options.token) {
//     baseHeaders["Authorization"] = `Bearer ${options.token}`
//   }

//   const res = await fetch(url, {
//     ...options,
//     headers: baseHeaders,
//   })

//   if (!res.ok) {
//     const errorData = await res.json().catch(() => ({}))

//     if (typeof window !== "undefined" && res.status === 401) {
//       const event = new CustomEvent("fetchError", {
//         detail: { status: 401 },
//       })
//       window.dispatchEvent(event)
//     }

//     throw new Error(errorData.message || `API Error (${res.status})`)
//   }

//   return res
// }

// fetchFromApi

'use server';

import { serverSession } from '@/actions/auth';
import { redirect } from 'next/navigation';

interface ExtendedRequestInit extends RequestInit {
  isTextResponse?: boolean;
}

export async function callApi<T>(endpoint: string, options: ExtendedRequestInit = {}): Promise<T> {
  const API_URL = process.env.IGRP_APP_MANAGER_API ?? '';
  const session = await serverSession();

  if (!session?.accessToken) {
    redirect('/login');
  }

  if (!API_URL) {
    throw new Error('[app-center] API_URL não esta definido.');
  }

  const url = `${API_URL}${endpoint}`;

  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.accessToken}`,
    ...((options.headers as Record<string, string>) || {}),
  };

  // Remove Content-Type for FormData
  if (options.body instanceof FormData) {
    delete baseHeaders['Content-Type'];
  }

  const response = await fetch(url, {
    ...options,
    headers: baseHeaders,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error (${response.status})`);
  }

  if (options.isTextResponse) {
    return (await response.text()) as unknown as T;
  }

  // Handle 204 No Content (delete operations) or empty responses
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return {} as T;
  }

  return (await response.json()) as T;
}
