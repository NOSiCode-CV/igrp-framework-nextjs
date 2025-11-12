'use client';

/* THIS FILE WAS GENERATED AUTOMATICALLY BY iGRP STUDIO. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { use, useState, useEffect, useRef } from 'react';
import { cn, useIGRPMenuNavigation, useIGRPToast } from '@igrp/igrp-framework-react-design-system';
import AcordManagementForm from '@/app/(igrp)/(generated)/gestao-acordos/components/acordmanagementform';
import { useGetAccord } from '@/app/(myapp)/hooks/accords-management';

export default function PageAccordeditComponent({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = use(params);

  const { igrpToast } = useIGRPToast();

  const { data, isLoading } = useGetAccord(uuid);

  return (
    <div className={cn('page', 'space-y-6')}>
      <div className={cn('section', ' space-y-6')}>
        <AcordManagementForm isEdit={true} initialData={data}></AcordManagementForm>
      </div>
    </div>
  );
}
