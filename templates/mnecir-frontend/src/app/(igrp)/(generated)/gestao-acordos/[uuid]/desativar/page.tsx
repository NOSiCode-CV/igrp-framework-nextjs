'use client';

/* THIS FILE WAS GENERATED AUTOMATICALLY BY iGRP STUDIO. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { use, useState, useEffect, useRef } from 'react';
import { cn, useIGRPMenuNavigation, useIGRPToast } from '@igrp/igrp-framework-react-design-system';
import DisableAccord from '@/app/(igrp)/(generated)/gestao-acordos/components/disableaccord';

export default function PageDisableaccordComponent({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = use(params);

  const { igrpToast } = useIGRPToast();

  return (
    <div className={cn('page', 'space-y-6')}>
      <div className={cn('section', ' space-y-6')}>
        <DisableAccord></DisableAccord>
      </div>
    </div>
  );
}
