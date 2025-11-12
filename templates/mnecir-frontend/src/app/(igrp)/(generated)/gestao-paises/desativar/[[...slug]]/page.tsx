'use client';

/* THIS FILE WAS GENERATED AUTOMATICALLY BY iGRP STUDIO. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { use, useState, useEffect, useRef } from 'react';
import { cn, useIGRPMenuNavigation, useIGRPToast } from '@igrp/igrp-framework-react-design-system';
import DisableCountryAndOrganizationForm from '@/app/(igrp)/(generated)/gestao-paises/components/disablecountryandorganizationform'
import { 
  IGRPPageHeader 
} from "@igrp/igrp-framework-react-design-system";
import { ApiError } from '@/app/(myapp)/utils/api-client'
import { redirect, useRouter } from 'next/navigation'
import {disableEnableGeneric} from '@/app/(myapp)/functions/generic'
import {getCountryAndOrgsById} from '@/app/(myapp)/functions/countries-orgs'


export default function PageDisablecountryandorganizationComponent({ params } : { params: Promise<{ slug?: string }> } ) {

  const { slug } = use(params);

  
  
  
const [pageTitle, setPageTitle] = useState<string>('');

const { igrpToast } = useIGRPToast()

async function handleEnableDisableCountry (data: any, countryStatus: string): Promise<void  | undefined> {

  const action = countryStatus === 'A' ? "disable" : "enable";

disableEnableGeneric("EO", slug || "", data, action).then(() => {
  const successMsg = countryStatus === 'A' ? "O país foi desativado com sucesso." : "O país foi ativado com sucesso.";

  igrpToast({
    type: "success",
    title: "Sucesso",
    description: successMsg,
  });

  router.push("/gestao-paises");
  
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

     redirect('/gestao-paises');

}

const router = useRouter();

useEffect(() => {
  
  const fetchData = async () => {
    const res = await getCountryAndOrgsById('P', slug || '');

    const title = res.status == 'A' ? "Desativar País" : "Ativar País";
    setPageTitle(title);

  } 

  if(slug) {
    fetchData();
  }


},[slug])


  return (
<div className={ cn('page','space-y-6',)}    >
	<div className={ cn('section',' space-x-6 space-y-6',)}    >
	<IGRPPageHeader
  name={ `pageHeader1` }
  iconBackButton={ `Search` }
  variant={ `h3` }
  className={ cn() }
  title={ pageTitle }
>
  <div className="flex items-center gap-2">
</div>
</IGRPPageHeader>

<div className={ cn('section','pr-4 pl-4 px-4',' space-x-6 space-y-6',)}    >
	<DisableCountryAndOrganizationForm  id={ slug }  saveAction={ handleEnableDisableCountry }
closeModal={ handleClose } ></DisableCountryAndOrganizationForm></div></div></div>
  );
}
