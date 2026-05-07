// packages/framework/next/src/layouts/providers/header-data-provider.tsx
import type { IGRPConfigArgs } from '@igrp/framework-next-types';
import { IGRPTemplateHeader } from '@igrp/framework-next-ui';

import { fetchCurrentUser } from '../../hooks/use-user';

type HeaderDataProviderProps = {
  config: Pick<IGRPConfigArgs, 'layoutMockData' | 'previewMode'>;
};

export async function HeaderDataProvider({ config }: HeaderDataProviderProps) {
  const { previewMode, layoutMockData } = config;
  const headerData = await layoutMockData.getHeaderData();

  if (previewMode) {
    return <IGRPTemplateHeader data={headerData} />;
  }

  const user = await fetchCurrentUser();

  return (
    <IGRPTemplateHeader
      data={{
        ...headerData,
        ...(user !== null && { user }),
      }}
    />
  );
}
