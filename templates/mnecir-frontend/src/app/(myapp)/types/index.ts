export interface PaginatedResponse<T> {
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  content: T[];
}

export type ParameterizationOption = {
  code: string;
  description: string;
};

export interface UploadingState {
  [key: number]: boolean;
}

export interface UploadingFiles {
  [key: number]: {
    file: File;
    uploaded?: boolean;
    url?: string;
    fileName?: string;
  };
}
