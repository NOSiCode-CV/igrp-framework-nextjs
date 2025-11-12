import { callApi } from "@/app/(myapp)/utils/api-client";
import {
  AddCountryBody,
  CountryOrgResponse,
  GetAllAsMapDataResponse,
  GetCountryOrgsParams,
  PaginatedCountryOrgResponse,
} from "../types/country";
import { IGRPOptionsProps } from "@igrp/igrp-framework-react-design-system";

export const createCountryAndOrgs = async (
  type: string,
  data: AddCountryBody,
) => {
  const API_URL = `/api/countries-orgs/?type=${type}`;

  const response = await callApi<CountryOrgResponse>(API_URL, {
    method: "POST",
    body: JSON.stringify(data),
  });

  return response;
};

export const getCountryAndOrgs = async (
  type: string,
  params?: GetCountryOrgsParams,
) => {
  const queryParams = new URLSearchParams();

  queryParams.append("type", type);

  if (params) {
    if (params.name) queryParams.append("name", params.name);
    if (params.geographicalArea)
      queryParams.append("geographicalArea", params.geographicalArea);
    if (params.countryGeoId)
      queryParams.append("countryGeoId", params.countryGeoId);
    if (params.alertLevel) queryParams.append("alertLevel", params.alertLevel);
    if (params.page !== undefined)
      queryParams.append("page", params.page.toString());
    if (params.size !== undefined)
      queryParams.append("size", params.size.toString());
  }

  const API_URL = `/api/countries-orgs?${queryParams.toString()}`;

  const response = await callApi<PaginatedCountryOrgResponse>(API_URL, {
    method: "GET",
  });

  return response;
};

export const getCountryAndOrgsById = async (type: string, id: string) => {
  const API_URL = `/api/countries-orgs-by-id/?type=${type}&id=${id}`;

  const response = await callApi<CountryOrgResponse>(API_URL, {
    method: "GET",
  });

  return response;
};

export const updateCountryAndOrgs = async (
  type: string,
  id: string,
  data: AddCountryBody,
) => {
  const API_URL = `/api/countries-orgs/?type=${type}&id=${id}`;

  const response = await callApi<PaginatedCountryOrgResponse>(API_URL, {
    method: "PUT",
    body: JSON.stringify(data),
  });

  return response;
};

export const getAllCountryAndOrgsAsMap = async (
  type?: string,
): Promise<IGRPOptionsProps[]> => {
  const API_URL = `/api/countries-orgs-asMap/?type=${type ?? ""}`;

  const response = await callApi<IGRPOptionsProps[]>(API_URL, {
    method: "GET",
  });

  return response;
};
