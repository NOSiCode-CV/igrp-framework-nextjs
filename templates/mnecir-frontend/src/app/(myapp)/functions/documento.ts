import { callApi } from "../utils/api-client";

export interface DocumentoUploadResponse {
  displayName: string;
  attachmentId: string;
}

export interface DocumentoUploadRequest {
  file: File;
  path?: string;
}

/**
 * Upload a document file to the API
 * @param data - The document upload request containing file and metadata
 * @returns Promise with the upload response
 */
export async function uploadDocumento(
  data: DocumentoUploadRequest,
): Promise<DocumentoUploadResponse> {
  const formData = new FormData();
  // formData.append('folder', 'Acordo');
  formData.append("file", data.file);

  if (data.path) {
    formData.append("path", data.path);
  }

  return await callApi<DocumentoUploadResponse>("/api/documento", {
    method: "POST",
    body: formData,
    headers: {
      // Don't set Content-Type header, let the browser set it with boundary for FormData
    },
  });
}
