import { callApi } from "@/app/(myapp)/utils/api-client";
import { DomainDataResponse } from "../types/domains";

export const getDomain = async (domain: string) => {
  const API_URL = `/api/domains?domain=${domain}`;
  const domainRes = await callApi<DomainDataResponse[]>(API_URL, {
    method: "GET",
  });
  return domainRes;
};
