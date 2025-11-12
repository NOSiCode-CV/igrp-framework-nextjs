export interface Accord {
  id: number;
  countryOrganizationName: string;
  type: string;
  title: string;
  signatureDate: string;
  needRatification: string;
  ratified: string;
  effectiveDate: string;
  statusDescription: string;
  phase: string;
  domain: string;
  boPublicationDate: string;
  nature: string;
  year: number;
}

export interface PaginatedAccordsResData {
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  content: Accord[];
}

export interface AddAccordBody {
  id: number;
  countryOrganizationName: string;
  type: string;
  title: string;
  signatureDate: string;
  needRatification: string;
  ratified: string;
  effectiveDate: string;
  statusDescription: string;
  phase: string;
  domain: string;
  boPublicationDate: string;
  nature: string;
  year: number;
  observationRatification: string;
  effectiveDateReference: string;
  formOfApproval: string;
  observations: string;
}

export interface AccordAddResponseData {
  id: number;
  countryOrganizationName: string;
  type: string;
  title: string;
  signatureDate: string;
  needRatification: string;
  ratified: string;
  effectiveDate: string;
  statusDescription: string;
  phase: string;
  domain: string;
  boPublicationDate: string;
  nature: string;
  year: number;
  observationRatification: string;
  effectiveDateReference: string;
  formOfApproval: string;
  observations: string;
  attachments?: Attachment[];
  countryOrganizations: CountryOrganization[];
}

export interface Attachment {
  id: number;
  documentType: string;
  docTypeDescription: string;
  documentName: string;
  documentUrl: string;
}

export interface CountryOrganization {
  id: number;
  countryOrgId: number;
  countryOrgDescription: string;
}

export interface AddAccordResponse {
  status: number;
  data: AccordAddResponseData;
}

export interface GetAccordParams {
  countryOrganizationId?: number;
  type?: string;
  year?: number;
  nature?: string;
  domain?: string;
  phase?: string;
  signed?: string;
  needRatification?: string;
  ratified?: string;
  status?: string;
  page?: number;
  size?: number;
}

export interface Documento {
  url: string;
  idTipoDocumento: number;
}
