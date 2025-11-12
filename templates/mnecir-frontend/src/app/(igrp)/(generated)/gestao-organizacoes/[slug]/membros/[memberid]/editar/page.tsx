'use client'

/* THIS FILE WAS GENERATED AUTOMATICALLY BY iGRP STUDIO. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { use, useState, useEffect, useRef } from 'react';
import { cn, useIGRPMenuNavigation, useIGRPToast } from '@igrp/igrp-framework-react-design-system';
import AddOrgMemberForm from '@/app/(igrp)/(generated)/gestao-organizacoes/components/addorgmemberform'
import { 
  IGRPPageHeader 
} from "@igrp/igrp-framework-react-design-system";
import {updateCountryAndOrgs} from '@/app/(myapp)/functions/countries-orgs'
import {updateMember} from '@/app/(myapp)/functions/members'
import { ApiError } from '@/app/(myapp)/utils/api-client'
import { redirect, useRouter } from 'next/navigation';


export default function PageMembermanagementeditComponent({ params } : { params: Promise<{ slug: string, memberid: string }> } ) {

  const { slug, memberid } = use(params);

  
  
  
const { igrpToast } = useIGRPToast()

async function saveMember (data: any): Promise<void  | undefined> {

  

try {
  await updateMember("O", slug, memberid, data);

   igrpToast({
    type: 'success',
    title: 'Sucesso',
    description: 'Membro editado com sucesso!',
  });

   router.push(`/gestao-organizacoes/${slug}/membros`);

}catch(err) {
  const error = err as ApiError;

  const message =
    error.message ||
    'Unexpected error occurred';

  igrpToast({
    type: 'error',
    title: `Erro ${error.status}`,
    description: message,
  });
}



}

function handleClose (): void  | undefined {

  redirect(`/gestao-organizacoes/${slug}/membros`);


}

const router = useRouter();




  return (
<div className={ cn('page','space-y-6',)}    >
	<div className={ cn('section',' space-y-6 space-x-6',)}    >
	<IGRPPageHeader
  name={ `pageHeader1` }
  title={ `Alterar Membro da Organização` }
  iconBackButton={ `ArrowLeft` }
  variant={ `h3` }
  className={ cn('','font-inter text-base leading-6 tracking-0 word-spacing-0 text-left font-normal not-italic no-underline normal-case',) }
  
>
  <div className="flex items-center gap-2">
</div>
</IGRPPageHeader>

<div className={ cn('section','pr-4 pl-4 px-4',' space-y-6 space-x-6',)}    >
	<AddOrgMemberForm  orgId={ slug } memberid={ memberid }  saveAction={ saveMember }
closeModal={ handleClose } ></AddOrgMemberForm></div></div></div>
  );
}
