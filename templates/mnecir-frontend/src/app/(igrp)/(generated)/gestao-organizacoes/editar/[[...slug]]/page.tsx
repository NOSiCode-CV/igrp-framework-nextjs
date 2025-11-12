'use client'

/* THIS FILE WAS GENERATED AUTOMATICALLY BY iGRP STUDIO. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { use, useState, useEffect, useRef } from 'react';
import { cn, useIGRPMenuNavigation, useIGRPToast } from '@igrp/igrp-framework-react-design-system';
import AddOrganizationForm from '@/app/(igrp)/(generated)/gestao-organizacoes/components/addorganizationform'
import { 
  IGRPPageHeader 
} from "@igrp/igrp-framework-react-design-system";
import {updateCountryAndOrgs} from '@/app/(myapp)/functions/countries-orgs'
import { ApiError } from '@/app/(myapp)/utils/api-client'
import { redirect, useRouter } from 'next/navigation'


export default function PageOrganizationmanagementeditComponent({ params } : { params: Promise<{ slug?: string }> } ) {

  const { slug } = use(params);

  
  
  
const { igrpToast } = useIGRPToast()

async function saveOrganization (data: any): Promise<void  | undefined> {

  updateCountryAndOrgs("O", slug || '', data).then(() => {
   igrpToast({
    type: 'success',
    title: 'Sucesso',
    description: 'Organização gravado com sucesso!',
  });

    router.push("/gestao-organizacoes");
}).catch((err) => {
    const error = err as ApiError;

    const message =
      error.message ||
      'Unexpected error occurred';

    igrpToast({
      type: 'error',
      title: `Erro ${error.status}`,
      description: message,
    });
});




}

function handleClose (): void  | undefined {

  redirect("/gestao-organizacoes");

}

const router = useRouter();


  return (
<div className={ cn('page','space-y-6',)}    >
	<div className={ cn('section',' space-y-6 space-x-6',)}    >
	<IGRPPageHeader
  name={ `pageHeader1` }
  title={ `Alterar Organização Internacional` }
  iconBackButton={ `ArrowLeft` }
  variant={ `h3` }
  className={ cn('','font-inter text-base leading-6 tracking-0 word-spacing-0 text-left font-normal not-italic no-underline normal-case',) }
  
>
  <div className="flex items-center gap-2">
</div>
</IGRPPageHeader>

<div className={ cn('section','pr-4 pl-4 px-4',' space-y-6 space-x-6',)}    >
	<AddOrganizationForm  id={ slug }  saveAction={ saveOrganization }
closeModal={ handleClose } ></AddOrganizationForm></div></div></div>
  );
}
