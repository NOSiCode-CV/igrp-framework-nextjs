import { useQuery } from "@tanstack/react-query";
import { getAccordById, getAccords } from "../functions/accords";
import { GetAccordParams } from "../types/accord";
import {
  DocumentoUploadRequest,
  DocumentoUploadResponse,
  uploadDocumento,
} from "../functions/documento";

export const useGetAccords = (params?: GetAccordParams) => {
  return useQuery({
    queryKey: ["accords", params],
    queryFn: () => getAccords(params),
    placeholderData: (prev) => prev,
  });
};

export const useGetAccord = (id: string) => {
  return useQuery({
    queryKey: ["accord", id],
    queryFn: () => getAccordById(id),
    enabled: !!id,
  });
};

// Document upload functions
export const uploadDocument = async (
  data: DocumentoUploadRequest,
): Promise<DocumentoUploadResponse> => {
  try {
    return await uploadDocumento(data);
  } catch (error) {
    throw error;
  }
};
