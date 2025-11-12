import { useQuery } from "@tanstack/react-query";
import { getCountriesByGeoArea, getGeography } from "../functions/geography";

export const useGetGeography = (id: string) => {
  return useQuery({
    queryKey: ["geography", id],
    queryFn: () => getGeography(id),
  });
};

export const useGetCountriesByGeoArea = (code: string) => {
  return useQuery({
    queryKey: ["geoarea", code],
    queryFn: () => getCountriesByGeoArea(code),
  });
};
