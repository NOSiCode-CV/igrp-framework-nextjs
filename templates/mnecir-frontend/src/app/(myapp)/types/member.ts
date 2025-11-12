export interface AddMemberBody {
  countryGeographyId: string | null;
  countryGeographyName: string | null;
  alertLevel: string | null;
  relationStartDate: string | null;
  note: string | null;
  type: string | null;
  name: string | null;
  acronym: string | null;
}

export interface AddMemberPayload {
  type: string | null;
  countryGeographyId: string | null;
  countryGeographyName: string | null;
  alertLevel: string | null;
  relationStartDate: string | null;
  organizationId?: string;
  note: string | null;
  acronym: string | null;
}

export interface MemberOrgResponse {
  id: number;
  organizationId: number;
  organizationName: string;
  countryGeographyId: string;
  countryGeographyName: string;
  alertLevel: string;
  relationStartDate: string;
  relationEndDate: string;
  note: string;
  status: string;
  statusDescription: string;
}

export interface GetMembersParams {
  organizationId: number;
  alertLevel?: string;
  countryName?: string;
}

export interface MemberResponseData {
  id: number;
  organizationId: 0;
  organizationName: string;
  countryGeographyId: string;
  countryGeographyName: string;
  alertLevel: string;
  relationStartDate: string;
  note: string;
  statusDescription: string;
}

export interface PaginatedMemberResponse {
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  content: MemberResponseData[];
}
