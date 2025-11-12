import { create } from "zustand";
import { PaginatedCountryOrgResponse } from "../types/country";
import { PaginatedMemberResponse } from "../types/member";

interface DataStore {
  data: PaginatedCountryOrgResponse | null;
  addData: (items: PaginatedCountryOrgResponse) => void;
}

interface MembersDataStore {
  data: PaginatedMemberResponse | null;
  addData: (items: PaginatedMemberResponse) => void;
}

export const useCountryTableStore = create<DataStore>((set) => ({
  data: null,
  addData: (items) => set((state) => ({ data: items })),
}));

export const useOrgsTableStore = create<DataStore>((set) => ({
  data: null,
  addData: (items) => set((state) => ({ data: items })),
}));

export const useMembersTableStore = create<MembersDataStore>((set) => ({
  data: null,
  addData: (items) => set((state) => ({ data: items })),
}));
