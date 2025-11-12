'use client';

/* THIS FILE WAS GENERATED AUTOMATICALLY BY iGRP STUDIO. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { use, useState, useEffect, useRef } from 'react';
import { cn, useIGRPMenuNavigation, useIGRPToast } from '@igrp/igrp-framework-react-design-system';
import AddCountryModal from '@/app/(igrp)/(generated)/gestao-paises/components/addcountrymodal';
import CountryFilterBar from '@/app/(igrp)/(generated)/gestao-paises/components/countryfilterbar';
import CountryList from '@/app/(igrp)/(generated)/gestao-paises/components/countrylist';
import { IGRPPageHeader } from '@igrp/igrp-framework-react-design-system';

export default function PageCountrymanagementComponent() {
  const { igrpToast } = useIGRPToast();

  return (
    <div className={cn('page', 'space-y-6')}>
      <div className={cn('section', ' space-y-6 space-x-6')}>
        <IGRPPageHeader
          name={`pageHeader1`}
          title={`Gestão de Paises`}
          iconBackButton={`Search`}
          variant={`h3`}
          className={cn('')}
        >
          <div className="flex items-center gap-2">
            <AddCountryModal></AddCountryModal>
          </div>
        </IGRPPageHeader>
      </div>
      <div className={cn('section', 'pr-4 pl-4 px-4', ' space-y-6 space-x-6')}>
        <CountryFilterBar></CountryFilterBar>
        <CountryList></CountryList>
      </div>
    </div>
  );
}
