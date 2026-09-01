import { IGRPRootProvidersBlank } from '@igrp/framework-next-ui';
import type { IGRPConfigArgs } from '@igrp/framework-next-types';

export type IGRPLayoutBlankArgs = {
  readonly children: React.ReactNode;
  readonly config: IGRPConfigArgs;
};

export async function IGRPLayoutBlank({ children, config }: IGRPLayoutBlankArgs) {
  const { toasterConfig } = config;

  return <IGRPRootProvidersBlank toasterConfig={toasterConfig}>{children}</IGRPRootProvidersBlank>;
}
