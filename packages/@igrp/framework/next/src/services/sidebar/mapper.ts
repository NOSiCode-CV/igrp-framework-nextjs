import type { IGRPSidebarDataArgs } from "@/types/globals";

export async function mapSidebarData(getSidebarData: () => Promise<IGRPSidebarDataArgs>): Promise<IGRPSidebarDataArgs> {
  return await getSidebarData();
}