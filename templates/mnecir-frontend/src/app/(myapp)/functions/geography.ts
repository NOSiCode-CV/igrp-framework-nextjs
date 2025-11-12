import { callApi } from "@/app/(myapp)/utils/api-client";
import { GeoByAreaDataResponse, GeoDataResponse } from "../types/geography";

export const getGeography = async (id: string) => {
  const API_URL = `/api/geography?id=${id}`;
  const geographies = await callApi<GeoDataResponse>(API_URL, {
    method: "POST",
  });

  return geographies;
};

export const getCountriesByGeoArea = async (code: string) => {
  const API_URL = `/api/geography/countries-by-geo-area?code=${code}`;
  const countries = await callApi<GeoByAreaDataResponse[]>(API_URL, {
    method: "GET",
  });
  return countries;
};
