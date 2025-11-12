import { callApi } from "@/app/(myapp)/utils/api-client";
import {
  AddMemberPayload,
  GetMembersParams,
  MemberOrgResponse,
  PaginatedMemberResponse,
} from "../types/member";

export const createMember = async (
  type: string,
  orgId: string,
  data: AddMemberPayload,
) => {
  const API_URL = `/api/members/?type=${type}&organizationId=${orgId}`;

  const response = await callApi<MemberOrgResponse>(API_URL, {
    method: "POST",
    body: JSON.stringify(data),
  });

  return response;
};

export const updateMember = async (
  type: string,
  orgId: string,
  memberId: string,
  data: AddMemberPayload,
) => {
  const API_URL = `/api/members/?type=${type}&organizationId=${orgId}&memberId=${memberId}`;

  const response = await callApi<MemberOrgResponse>(API_URL, {
    method: "PUT",
    body: JSON.stringify(data),
  });

  return response;
};

export const getMembers = async (type: string, params: GetMembersParams) => {
  const queryParams = new URLSearchParams({
    type,
    organizationId: params.organizationId.toString(),
  });

  if (params.alertLevel) {
    queryParams.append("alertLevel", params.alertLevel);
  }

  if (params.countryName) {
    queryParams.append("countryName", params.countryName);
  }

  const API_URL = `/api/members?${queryParams.toString()}`;

  const response = await callApi<PaginatedMemberResponse>(API_URL, {
    method: "GET",
  });

  return response;
};

export const getMemberById = async (
  type: string,
  orgId: string,
  memberId: string,
) => {
  const API_URL = `/api/members-by-id/?type=${type}&orgId=${orgId}&memberId=${memberId}`;

  const response = await callApi<MemberOrgResponse>(API_URL, {
    method: "GET",
  });

  return response;
};
