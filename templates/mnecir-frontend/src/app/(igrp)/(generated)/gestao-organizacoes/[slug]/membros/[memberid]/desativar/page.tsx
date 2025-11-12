'use client'

/* THIS FILE WAS GENERATED AUTOMATICALLY BY iGRP STUDIO. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { use, useState, useEffect, useRef } from 'react';
import { cn, useIGRPMenuNavigation, useIGRPToast } from '@igrp/igrp-framework-react-design-system';
import DisableMemberForm from '@/app/(igrp)/(generated)/gestao-organizacoes/components/disablememberform'
import { 
  IGRPPageHeader 
} from "@igrp/igrp-framework-react-design-system";
import { ApiError } from '@/app/(myapp)/utils/api-client'
import {disableEnableGeneric} from '@/app/(myapp)/functions/generic'
import { redirect, useRouter } from 'next/navigation'
import {getMemberById} from '@/app/(myapp)/functions/members'


export default function PageMembermanagementdisableComponent({ params } : { params: Promise<{ slug: string, memberid: string }> } ) {

  const { slug, memberid } = use(params);

  
  
  
const [pageTitle, setPageTitle] = useState<string>('');

const { igrpToast } = useIGRPToast()

async function handleEnableDisableOrg (data: any, orgStatus: string): Promise<void  | undefined> {

  const action = orgStatus === 'A' ? "disable" : "enable"

disableEnableGeneric('PM', memberid, data, action).then(() => {
   const successMsg = orgStatus === 'A' ? "A organização foi desativado com sucesso." : "A organização foi ativado com sucesso.";

  igrpToast({
    type: "success",
    title: "Sucesso",
    description: successMsg,
  });

  route.push(`/gestao-organizacoes/${slug}/membros`);
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

  redirect("/gestao-organizacoes")

}

const route = useRouter();


    
 
 useEffect(() => {
  
  const fetchData = async () => {
    
    const res = await getMemberById('O', slug, memberid);

    const title = res.status == 'A' ? "Desativar Membro da Organização" : "Ativar  Membro da Organização";
    setPageTitle(title);

  } 

  if(slug && memberid) {
    fetchData();
  }


},[slug, memberid])


  return (
<div className={ cn('page','space-y-6',)}    >
	<div className={ cn('section',' space-y-6',)}    >
	<IGRPPageHeader
  name={ `pageHeader1` }
  iconBackButton={ `ArrowLeft` }
  variant={ `h3` }
  title={ pageTitle }
>
  <div className="flex items-center gap-2">
</div>
</IGRPPageHeader>

<div className={ cn('section','pr-4 pl-4 px-4',' space-y-6 space-x-6',)}    >
	<DisableMemberForm  memberId={ memberid } orgId={ slug }  saveAction={ handleEnableDisableOrg }
closeModal={ handleClose } ></DisableMemberForm></div></div></div>
  );
}
