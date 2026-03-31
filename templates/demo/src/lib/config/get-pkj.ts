import type { IGRPPackageJson } from "@igrp/framework-next-types";
import { cache } from "react";
import pkg from "../../../package.json";

/**
 * Reads package.json fields for IGRP app info. Cached per request.
 *
 * @returns App name, version, description, displayName
 */
export const getPackageJson = cache(function getPackageJson() {
  const appInfo: IGRPPackageJson = {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    displayName: pkg.displayName,
  };
  return appInfo;
});
