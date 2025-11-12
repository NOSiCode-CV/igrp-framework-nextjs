'use client'

/* THIS FILE WAS GENERATED AUTOMATICALLY BY iGRP STUDIO. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { use, useState, useEffect, useRef } from 'react';
import { cn, useIGRPMenuNavigation, useIGRPToast } from '@igrp/igrp-framework-react-design-system';
import DisableOrganizationForm from '@/app/(igrp)/(generated)/gestao-organizacoes/components/disableorganizationform'
import { 
  IGRPPageHeader 
} from "@igrp/igrp-framework-react-design-system";
import { ApiError } from '@/app/(myapp)/utils/api-client'
import {disableEnableGeneric} from '@/app/(myapp)/functions/generic'
import { redirect, useRouter } from 'next/navigation'
import {getCountryAndOrgsById} from '@/app/(myapp)/functions/countries-orgs'


export default function PageOrganizationmanagementdisableComponent({ params } : { params: Promise<{ slug?: string }> } ) {

  const { slug } = use(params);

  
  
  
const [pageTitle, setPageTitle] = useState<string>('');

const { igrpToast } = useIGRPToast()

async function handleEnableDisableOrg (data: any, orgStatus: string): Promise<void  | undefined> {

  const action = orgStatus === 'A' ? "disable" : "enable";


disableEnableGeneric("EO", slug || "", data, action).then(() => {
   const successMsg = orgStatus === 'A' ? "A organização foi desativado com sucesso." : "A organização foi ativado com sucesso.";

  igrpToast({
    type: "success",
    title: "Sucesso",
    description: successMsg,
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

  redirect("/gestao-organizacoes")

}

const router = useRouter();

useEffect(() => {

   const fetchData = async () => {
      const res = await getCountryAndOrgsById('O', slug || '');

      const title = res.status == 'A' ? "Desativar Organização Internacional" : "Ativar Organização Internacional";
      setPageTitle(title);
   }

   if(slug) {
      fetchData();
   }
 
},[slug])




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
	<DisableOrganizationForm  id={ slug }  saveAction={ handleEnableDisableOrg }
closeModal={ handleClose } ></DisableOrganizationForm></div></div></div>
  );
}
