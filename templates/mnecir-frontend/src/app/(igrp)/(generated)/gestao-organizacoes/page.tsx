'use client';

/* THIS FILE WAS GENERATED AUTOMATICALLY BY iGRP STUDIO. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { use, useState, useEffect, useRef } from 'react';
import { cn, useIGRPMenuNavigation, useIGRPToast } from '@igrp/igrp-framework-react-design-system';
import AddOrganizationModal from '@/app/(igrp)/(generated)/gestao-organizacoes/components/addorganizationmodal';
import OrganizationFilterBar from '@/app/(igrp)/(generated)/gestao-organizacoes/components/organizationfilterbar';
import OrganizationList from '@/app/(igrp)/(generated)/gestao-organizacoes/components/organizationlist';
import { IGRPPageHeader } from '@igrp/igrp-framework-react-design-system';

export default function PageOrganizationmanagementComponent() {
  const { igrpToast } = useIGRPToast();

  return (
    <div className={cn('page', 'space-y-6')}>
      <div className={cn('section', ' space-y-6 space-x-6')}>
        <IGRPPageHeader
          name={`pageHeader1`}
          title={`Gestão de Organizações Internacionais`}
          iconBackButton={`ArrowLeft`}
          variant={`h3`}
          className={cn()}
        >
          <div className="flex items-center gap-2">
            <AddOrganizationModal></AddOrganizationModal>
          </div>
        </IGRPPageHeader>
      </div>
      <div className={cn('section', 'pr-4 pl-4 px-4', ' space-y-6 space-x-6')}>
        <OrganizationFilterBar></OrganizationFilterBar>
        <OrganizationList></OrganizationList>
      </div>
    </div>
  );
}
