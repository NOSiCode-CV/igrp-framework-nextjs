import type { SidebarData } from "@/types/globals";

export async function mapSidebarData(getSidebarData: () => Promise<SidebarData>): Promise<SidebarData> {
  return await getSidebarData();
}