import { IGRP_MOCK_APPS_DATA } from "./apps";

/**
 * Returns mock application data for development/demo.
 *
 * @returns Object with mockApps array
 */
export function getMockApps() {
  return {
    mockApps: IGRP_MOCK_APPS_DATA,
  };
}
