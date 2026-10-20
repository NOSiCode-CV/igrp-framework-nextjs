import { IGRPRootProvidersBlank } from '@igrp/framework-next-ui';
import type { IGRPConfigArgs } from '@igrp/framework-next-types';

export type IGRPLayoutBlankArgs = {
  readonly children: React.ReactNode;
  readonly config: IGRPConfigArgs;
};

// i18n: nothing to seed here. The blank layout makes no framework API calls
// (so no `Accept-Language`), and the intl provider is mounted once by
// `IGRPRootLayout`, above both route-group layouts.
export async function IGRPLayoutBlank({ children, config }: IGRPLayoutBlankArgs) {
  const { toasterConfig } = config;

  return <IGRPRootProvidersBlank toasterConfig={toasterConfig}>{children}</IGRPRootProvidersBlank>;
}
