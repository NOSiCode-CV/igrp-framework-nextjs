'use client';

/* THIS FILE WAS GENERATED AUTOMATICALLY BY iGRP STUDIO. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { use, useState, useEffect, useRef } from 'react';
import { cn, useIGRPMenuNavigation, useIGRPToast } from '@igrp/igrp-framework-react-design-system';
import AddCountryForm from '@/app/(igrp)/(generated)/gestao-paises/components/addcountryform'
import { 
  IGRPPageHeader 
} from "@igrp/igrp-framework-react-design-system";
import {updateCountryAndOrgs} from '@/app/(myapp)/functions/countries-orgs'
import { ApiError } from '@/app/(myapp)/utils/api-client'
import { redirect, useRouter } from 'next/navigation';


export default function PageCountryeditComponent({ params } : { params: Promise<{ slug?: string }> } ) {

  const { slug } = use(params);

  
  
  
const { igrpToast } = useIGRPToast()

async function saveCountry (data: any): Promise<void  | undefined> {

  
  updateCountryAndOrgs("P", slug || '', data).then(() => {
    igrpToast({
    type: 'success',
    title: 'Sucesso',
    description: 'País gravado com sucesso!',
    });

    router.push('/gestao-paises');
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
  })
  


    


}

function handleCloseModal (): void  | undefined {

  redirect('/gestao-paises');

}

const router = useRouter();


  return (
<div className={ cn('page','space-y-6',)}    >
	<div className={ cn('section',' space-x-6 space-y-6',)}    >
	<IGRPPageHeader
  name={ `pageHeader1` }
  title={ `Alterar País` }
  iconBackButton={ `Search` }
  variant={ `h3` }
  className={ cn() }
  
>
  <div className="flex items-center gap-2">
</div>
</IGRPPageHeader>

<div className={ cn('section','pr-4 pl-4 px-4',' space-x-6 space-y-6',)}    >
	<AddCountryForm  id={ slug }  saveAction={ saveCountry }
closeModal={ handleCloseModal } ></AddCountryForm></div></div></div>
  );
}
