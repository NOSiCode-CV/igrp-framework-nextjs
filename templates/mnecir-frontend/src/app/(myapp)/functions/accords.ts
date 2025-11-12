import { igrpBuildQueryString } from "@igrp/framework-next";
import {
  AccordAddResponseData,
  PaginatedAccordsResData,
  AddAccordResponse,
  GetAccordParams,
} from "../types/accord";
import { callApi } from "../utils/api-client";

export const getAccords = async (params?: GetAccordParams) => {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        queryParams.append(key, String(value));
      }
    });
  }

  const API_URL = `/api/accords${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

  const accords = await callApi<PaginatedAccordsResData>(API_URL, {
    method: "GET",
  });

  console.log(accords);
  return accords;
};

export const getAccordById = async (id: string) => {
  const API_URL = `/api/accords?id=${id}`;

  const accord = await callApi<PaginatedAccordsResData>(API_URL, {
    method: "GET",
  });

  console.log(accord);
  return accord;
};

export const createOrUpdateAccord = async (data: AccordAddResponseData) => {
  const API_URL = `/api/accords`;

  console.log("Data to be sent:", data);
  const cleanedData = {
    ...data,
    countryOrganizations: (data.countryOrganizations || []).filter(
      (org) =>
        org &&
        Object.values(org).some(
          (value) => value !== null && value !== undefined && value !== "",
        ),
    ),
    attachments: (data.attachments || []).filter(
      (att) =>
        att &&
        Object.values(att).some(
          (value) => value !== null && value !== undefined && value !== "",
        ),
    ),
  };

  const method = data.id ? "PUT" : "POST";

  const accord = await callApi<AccordAddResponseData>(API_URL, {
    method,
    body: JSON.stringify(cleanedData),
  });
};
