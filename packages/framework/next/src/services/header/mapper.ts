import type { IGRPHeaderDataArgs } from "../../types";
import { fetchCurrentUser } from "../users/use-user";

export async function mapHeaderData(
  getHeaderData: () => Promise<IGRPHeaderDataArgs>,
  previewMode: boolean,
): Promise<IGRPHeaderDataArgs> {
  
  let headerData = await getHeaderData()

  if (!previewMode) {  
    const user = await fetchCurrentUser();

    headerData = {
      ...headerData,
      user
    }
  }

  return headerData;  
}