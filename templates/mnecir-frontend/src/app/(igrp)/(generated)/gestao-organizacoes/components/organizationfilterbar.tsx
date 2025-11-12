'use client'

/* THIS FILE WAS GENERATED AUTOMATICALLY BY iGRP STUDIO. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { use, useState, useEffect, useRef } from 'react';
import { cn, useIGRPMenuNavigation, useIGRPToast } from '@igrp/igrp-framework-react-design-system';
import { IGRPFormHandle } from "@igrp/igrp-framework-react-design-system";
import { z } from "zod"
import { IGRPOptionsProps } from "@igrp/igrp-framework-react-design-system";
import {Progress} from '@/app/(myapp)/components/progress'
import { 
  IGRPText,
	IGRPForm,
	IGRPSelect,
	IGRPButton 
} from "@igrp/igrp-framework-react-design-system";
import { ApiError } from '@/app/(myapp)/utils/api-client'
import {getCountryAndOrgs} from '@/app/(myapp)/functions/countries-orgs'
import { useOrgsTableStore} from '@/app/(myapp)/store/store';

export default function Organizationfilterbar() {

  
  const form1 = z.object({
    organization: z.string().optional()
})

type Form1ZodType = typeof form1;

const initForm1: z.infer<Form1ZodType> = {
    organization: undefined
}


  const formform1Ref = useRef<IGRPFormHandle<Form1ZodType> | null>(null);
  const [form1Data, setForm1Data] = useState<any>(initForm1);
  const [selectorganizationOptions, setSelectorganizationOptions] = useState<IGRPOptionsProps[]>([]);
  
const [loading, setLoading] = useState<boolean>(true);

const [orgFilter, setOrgFilter] = useState<string>('');

const { igrpToast } = useIGRPToast()

async function handleSearch (): Promise<void  | undefined> {

  const params = {
  name: orgFilter,
}

getCountryAndOrgs("O",params ).then((res) => {
  addData(res);
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

async function handleResetFilters (): Promise<void  | undefined> {

  

setForm1Data({
  organization: '',
});


setOrgFilter('');

getCountryAndOrgs("O").then((res) => {
  addData(res);
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

const addData = useOrgsTableStore((state) => state.addData);
  
useEffect(() => {

  const fetchData = async () => {
     const res = await getCountryAndOrgs("O");

      if(res) {
    
      const filterOrgsData = res.content.map((item) => (
        {
          value: item.name || '',
          label: item.name || ''
        }
      ));

      const sortedOrgsData = filterOrgsData.sort((a,b) => a.label.localeCompare(b.label));


      if(sortedOrgsData) {
        setSelectorganizationOptions(sortedOrgsData);
        setLoading(false);

  

      }
   }
  }


    
 
 fetchData();
  
}, []);



  return (
<div className={ cn('component','block','w-[100%] overflow-visible',)}    >
	{ !loading && (<div className={ cn('flex','flex flex-col flex-nowrap items-stretch justify-start gap-2','pt-10 pr-10 pb-10 pl-10 px-10 py-10','border border-solid border-[#E0E0E0] rounded-xl',)}    >
	<div className={ cn('flex','flex flex-col flex-nowrap items-stretch justify-start gap-2','w-[100%] overflow-visible',)}    >
	<IGRPText
  name={ `text1` }
  variant={ `primary` }
weight={ `normal` }
size={ `default` }
align={ `left` }
spacing={ `normal` }
maxLines={ 3 }
  className={ cn('','font-inter text-[22px] leading-6 tracking-0 word-spacing-0 text-left font-normal not-italic no-underline normal-case',) }
  
  
>
  Filtros
</IGRPText>
<IGRPForm
  schema={ form1 }
  validationMode={ `onBlur` }
formRef={ formform1Ref }
  className={ cn('','overflow-visible',) }
  onSubmit={ (e) => {} }
  defaultValues={ form1Data }
>
  <>
  <div className={ cn('grid','grid-cols-1 ','md:grid-cols-2 ','lg:grid-cols-4 ',' gap-4',)}    >
	<IGRPSelect
  name={ `organization` }
  label={ `Organização` }
placeholder={ `Select an option...` }
gridSize={ `full` }
showSearch={ true }
  onValueChange={ (e) => setOrgFilter(e)
 }
  options={ selectorganizationOptions }
>
</IGRPSelect></div>
</>
</IGRPForm></div>
<div className={ cn('flex','flex flex-row flex-nowrap items-center justify-start gap-5','mt-5',)}    >
	<IGRPButton
  name={ `button2` }
  variant={ `default` }
size={ `default` }
showIcon={ false }
  className={ cn() }
  onClick={ handleSearch }
  
>
  Filtrar Organizações
</IGRPButton>
<IGRPButton
  name={ `button1` }
  variant={ `outline` }
size={ `default` }
showIcon={ false }
  className={ cn() }
  onClick={ handleResetFilters }
  
>
  Limpar filtros
</IGRPButton></div></div>)}
{ loading && (<div className={ cn('flex','flex flex-row flex-nowrap items-center justify-center gap-2',)}    >
	<Progress    ></Progress></div>)}</div>
  );
}
