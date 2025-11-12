export interface AddCountryBody {
  name: string | null;
  acronym?: string | null;
  geographicalArea: string | null;
  countryGeographyId: string | null;
  countryGeographyName: string | null;
  relationStartDate: string | null;
  alertLevel: string | null;
  note: string | null;
  type: string;
}

export interface DisableBody {
  reason: string;
  relationEndDate: string;
}

export interface CountryOrgResponse {
  id: number;
  name: string;
  acronym: string;
  geographicalArea: string;
  geographicalAreaDescription: string;
  geographyId: string;
  geographyName: string;
  alertLevel: string;
  relationStartDate: string;
  alertLevelDescription: string;
  relationEndDate: string;
  status: string;
  statusDescription: string;
  note: string;
}

export interface PaginatedCountryOrgResponse {
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  content: CountryOrgResponse[];
}

export interface GetCountryOrgsParams {
  name?: string;
  geographicalArea?: string;
  countryGeoId?: string;
  alertLevel?: string;
  page?: number;
  size?: number;
}

export interface GetAllAsMapDataResponse {
  value: string;
  label: string;
  status: string;
}
