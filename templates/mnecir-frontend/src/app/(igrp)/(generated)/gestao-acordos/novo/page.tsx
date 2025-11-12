'use client';

/* THIS FILE WAS GENERATED AUTOMATICALLY BY iGRP STUDIO. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { use, useState, useEffect, useRef } from 'react';
import { cn, useIGRPMenuNavigation, useIGRPToast } from '@igrp/igrp-framework-react-design-system';
import AcordManagementForm from '@/app/(igrp)/(generated)/gestao-acordos/components/acordmanagementform';

export default function PageAccordmanagementnovoComponent() {
  const { igrpToast } = useIGRPToast();

  return (
    <div className={cn('page', 'space-y-6')}>
      <div className={cn('section', ' space-y-6')}>
        <AcordManagementForm></AcordManagementForm>
      </div>
    </div>
  );
}
