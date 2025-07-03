import type { HeaderData } from "@/types/globals";

export async function mapHeaderData(getHeaderData: () => Promise<HeaderData>): Promise<HeaderData> {
  return await getHeaderData();
}