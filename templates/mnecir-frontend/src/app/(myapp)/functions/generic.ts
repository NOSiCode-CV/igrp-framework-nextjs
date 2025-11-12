import { callApi } from "@/app/(myapp)/utils/api-client";
import { CountryOrgResponse, DisableBody } from "../types/country";
import { IGRPOptionsProps } from "@igrp/igrp-framework-react-design-system";

export const disableEnableGeneric = async (
  type: string,
  id: string,
  data: DisableBody,
  action: string,
) => {
  const API_URL = `/api/generic/?type=${type}&id=${id}&action=${action}`;

  const response = await callApi<CountryOrgResponse>(API_URL, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

  return response;
};
