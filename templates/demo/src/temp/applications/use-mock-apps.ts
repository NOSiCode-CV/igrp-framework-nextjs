import { IGRP_MOCK_APPS_DATA } from '@/temp/applications/apps';

export const useMockApps = (appCode?: string) => {
  return {
    mockApps: IGRP_MOCK_APPS_DATA,
  };
};
