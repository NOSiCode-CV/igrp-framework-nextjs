'use client';

/* THIS FILE WAS GENERATED AUTOMATICALLY BY iGRP STUDIO. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { use, useState, useEffect, useRef } from 'react';
import { cn, useIGRPMenuNavigation, useIGRPToast } from '@igrp/igrp-framework-react-design-system';
import { IGRPButton, IGRPBadge } from '@igrp/igrp-framework-react-design-system';

export default function PageDisableaccordComponent({
  params,
}: {
  params: Promise<{ slug?: string }>;
}) {
  const { slug } = use(params);

  const { igrpToast } = useIGRPToast();

  return (
    <div className={cn('page', 'space-y-6')}>
      <IGRPButton name={`button1`} variant={`default`} size={`default`} onClick={() => {}}>
        Button
      </IGRPButton>
      <div className={cn('section', ' space-y-6')}></div>
      <IGRPBadge
        name={`badge2`}
        color={`primary`}
        variant={`solid`}
        size={`md`}
        iconName={`Info`}
        iconPlacement={`start`}
      >
        Badge
      </IGRPBadge>
      <IGRPBadge
        name={`badge1`}
        color={`primary`}
        variant={`solid`}
        size={`md`}
        iconName={`Info`}
        iconPlacement={`start`}
      >
        Badge
      </IGRPBadge>
    </div>
  );
}
