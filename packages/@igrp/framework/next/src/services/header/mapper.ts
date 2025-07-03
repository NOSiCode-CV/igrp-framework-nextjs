import type { IGRPHeaderDataArgs } from "@/types/globals";

export async function mapHeaderData(getHeaderData: () => Promise<IGRPHeaderDataArgs>): Promise<IGRPHeaderDataArgs> {
  return await getHeaderData();
}