import fs from "fs";
import path from "path";

import { logger } from "@/lib/errors";

export type GetRoutesResult = {
  appRoutes: string[];
  paramMapBody: string;
};

const EMPTY_ROUTES: GetRoutesResult = { appRoutes: [], paramMapBody: "" };

/**
 * Reads Next.js generated routes from .next/types/routes.d.ts.
 * Returns safe defaults if the file is missing or invalid (e.g. before first build).
 * Uses async file operations for better compatibility with serverless environments.
 */
export async function getRoutes(): Promise<GetRoutesResult> {
  const file = path.join(process.cwd(), ".next/types/routes.d.ts");

  try {
    const content = await fs.promises.readFile(file, "utf8");

    const appRoutesMatch = content.match(
      /type AppRoutes\s*=\s*([\s\S]*?)\n(?=type|interface)/,
    );

    if (!appRoutesMatch) {
      logger.warn("Could not find AppRoutes in routes.d.ts", { file });
      return EMPTY_ROUTES;
    }

    const appRoutes = appRoutesMatch[1]
      .split("|")
      .map((r) => r.trim().replace(/"/g, ""))
      .filter((r) => r.length > 0 && !r.startsWith("type"));

    const paramMapMatch = content.match(/interface ParamMap\s*{([\s\S]*?)^}/m);

    if (!paramMapMatch) {
      logger.warn("Could not find ParamMap in routes.d.ts", { file });
      return { appRoutes, paramMapBody: "" };
    }

    const paramMapBody = paramMapMatch[1];

    return { appRoutes, paramMapBody };
  } catch (error) {
    logger.warn("Could not read routes file", {
      error: error instanceof Error ? error.message : String(error),
      file: path.join(process.cwd(), ".next/types/routes.d.ts"),
    });

    return EMPTY_ROUTES;
  }
}
