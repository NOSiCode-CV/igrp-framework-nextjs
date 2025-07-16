import { IGRP_MOCK_APPS_DATA } from '@/temp/applications/apps';

export const getMockApps = (appCode?: string) => {
  console.log({ appCode });
  return {
    mockApps: IGRP_MOCK_APPS_DATA,
  };
};
