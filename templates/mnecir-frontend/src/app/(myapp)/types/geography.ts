export interface Geography {
  id: number;
  nacionalidade: string;
  nome: string;
}

export interface GeoDataResponse {
  Entries: {
    Entry: Geography[];
  };
}

export interface GeoByAreaDataResponse {
  value: string;
  label: string;
}
