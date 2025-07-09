import { getAccessClient } from "@/lib/api-client";
import { mapperApplications } from "./mapper";

export const fetchAppByCode = async (appCode: string) => {
  try {
    if (!appCode) throw new Error("Applications Code not found");

    const client = await getAccessClient();
    const result = await client.applications.getApplications({ code: appCode });
    const app = mapperApplications(result)
    return app;

  } catch (error) {
    console.error("Failed to fetch application data:", error);
    throw error;
  }
}

export const fetchAppsByUser = async (username: string) => {
  try {
    if (!username) throw new Error("User not found");

    const client = await getAccessClient();
    const result = await client.applications.getApplicationsByUser(username);
    const apps = result.data.map(mapperApplications)
    return apps;

  } catch (error) {
    console.error("Failed to fetch application data:", error);
    throw error;
  }
}