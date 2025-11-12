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
import { 
  IGRPForm,
	IGRPText,
	IGRPSelect,
	IGRPInputNumber,
	IGRPButton 
} from "@igrp/igrp-framework-react-design-system";
import {useGetAccords} from '@/app/(myapp)/hooks/accords-management'
import {useGetDomainAccord} from '@/app/(myapp)/hooks/domain'
import {getAllCountryAndOrgsAsMap} from '@/app/(myapp)/functions/countries-orgs'

export default function Accordfilterbar({ onSubmitFilter } : { onSubmitFilter: (values: any) => void }) {

  
  const form1 = z.object({
    country: z.string().optional(),
    type: z.string().optional(),
    year: z.string().optional(),
    nature: z.string().optional(),
    domain: z.string().optional(),
    phase: z.string().optional(),
    signed: z.string().optional(),
    needRatification: z.string().optional(),
    ratified: z.string().optional(),
    status: z.string().optional()
})

type Form1ZodType = typeof form1;

const initForm1: z.infer<Form1ZodType> = {
    country: ``,
    type: ``,
    year: ``,
    nature: ``,
    domain: ``,
    phase: ``,
    signed: ``,
    needRatification: ``,
    ratified: ``,
    status: ``
}


  const formform1Ref = useRef<IGRPFormHandle<Form1ZodType> | null>(null);
  const [form1Data, setForm1Data] = useState<any>(initForm1);
  const [selectcountryOptions, setSelectcountryOptions] = useState<IGRPOptionsProps[]>([]);
  const [selecttypeOptions, setSelecttypeOptions] = useState<IGRPOptionsProps[]>([]);
  const [selectnatureOptions, setSelectnatureOptions] = useState<IGRPOptionsProps[]>([]);
  const [selectdomainOptions, setSelectdomainOptions] = useState<IGRPOptionsProps[]>([]);
  const [selectphaseOptions, setSelectphaseOptions] = useState<IGRPOptionsProps[]>([]);
  const [selectsignedOptions, setSelectsignedOptions] = useState<IGRPOptionsProps[]>([]);
  const [selectneedRatificationOptions, setSelectneedRatificationOptions] = useState<IGRPOptionsProps[]>([]);
  const [selectratifiedOptions, setSelectratifiedOptions] = useState<IGRPOptionsProps[]>([]);
  const [selectstatusOptions, setSelectstatusOptions] = useState<IGRPOptionsProps[]>([]);
  
const { igrpToast } = useIGRPToast()

async function searchAccord (values: any): Promise<void  | undefined> {

  onSubmitFilter(values);

}


const {
  isLoading,
  tipoOptions,
  natOptions,
  domainOptions,
  phaseOptions,
  yesNoOptions,
  statusOptions
} = useGetDomainAccord();

useEffect(() => {
  if (isLoading) return;

 setSelecttypeOptions(tipoOptions);
 setSelectnatureOptions(natOptions);
 setSelectdomainOptions(domainOptions);
 setSelectphaseOptions(phaseOptions);
 setSelectsignedOptions(yesNoOptions);
 setSelectneedRatificationOptions(yesNoOptions);
 setSelectratifiedOptions(yesNoOptions);
 setSelectstatusOptions(statusOptions);

  const fetchCountriesOrgs = async () => {
    try {
      const response = await getAllCountryAndOrgsAsMap(''); 
      setSelectcountryOptions(response);
    
      
    } catch (error) {
      console.error("Erro ao carregar países e organizações:", error);
    }
  };

  fetchCountriesOrgs();

}, [isLoading]);


  return (
<div className={ cn('component',)}    >
	<div className={ cn(' border rounded-lg p-3',)}    >
	<IGRPForm
  schema={ form1 }
  validationMode={ `onBlur` }
formRef={ formform1Ref }
  className={ cn('',) }
  onSubmit={ searchAccord }
  defaultValues={ form1Data }
>
  <>
  <IGRPText
  name={ `text1` }
  variant={ `primary` }
weight={ `medium` }
size={ `default` }
align={ `left` }
spacing={ `normal` }
maxLines={ 3 }
  className={ cn() }
  
  
>
  Filtros
</IGRPText>
  <div className={ cn('grid','grid-cols-1 ','md:grid-cols-2 ','lg:grid-cols-4 ',' gap-4',)}    >
	<IGRPSelect
  name={ `country` }
  label={ `País / Organização internacional` }
placeholder={ `Select an option...` }
required={ undefined }
gridSize={ `full` }
  className={ cn('col-span-1',) }
  onValueChange={ () => {} }
  options={ selectcountryOptions }
>
</IGRPSelect>
<IGRPSelect
  name={ `type` }
  label={ `Tipo` }
placeholder={ `Select an option...` }
gridSize={ `full` }
  className={ cn('col-span-1',) }
  onValueChange={ () => {} }
  options={ selecttypeOptions }
>
</IGRPSelect>
<IGRPInputNumber
  name={ `year` }
  label={ `Ano` }
max={ 9999999 }
step={ 1 }
required={ false }
  className={ cn('col-span-1',) }
  
  
>
</IGRPInputNumber>
<IGRPSelect
  name={ `nature` }
  label={ `Natureza` }
placeholder={ `Select an option...` }
gridSize={ `full` }
  className={ cn('col-span-1',) }
  onValueChange={ () => {} }
  options={ selectnatureOptions }
>
</IGRPSelect>
<IGRPSelect
  name={ `domain` }
  label={ `Dominio` }
placeholder={ `Select an option...` }
gridSize={ `full` }
  className={ cn('col-span-1',) }
  onValueChange={ () => {} }
  options={ selectdomainOptions }
>
</IGRPSelect>
<IGRPSelect
  name={ `phase` }
  label={ `Fase` }
placeholder={ `Select an option...` }
gridSize={ `full` }
  className={ cn('col-span-1',) }
  onValueChange={ () => {} }
  options={ selectphaseOptions }
>
</IGRPSelect>
<IGRPSelect
  name={ `signed` }
  label={ `Assinado` }
placeholder={ `Select an option...` }
gridSize={ `full` }
  className={ cn('col-span-1',) }
  onValueChange={ () => {} }
  options={ selectsignedOptions }
>
</IGRPSelect>
<IGRPSelect
  name={ `needRatification` }
  label={ `Exige ratificação?` }
placeholder={ `Select an option...` }
gridSize={ `full` }
  className={ cn('col-span-1',) }
  onValueChange={ () => {} }
  options={ selectneedRatificationOptions }
>
</IGRPSelect>
<IGRPSelect
  name={ `ratified` }
  label={ `Ratificado?` }
placeholder={ `Select an option...` }
gridSize={ `full` }
  className={ cn('col-span-1',) }
  onValueChange={ () => {} }
  options={ selectratifiedOptions }
>
</IGRPSelect>
<IGRPSelect
  name={ `status` }
  label={ `Estado` }
placeholder={ `Select an option...` }
gridSize={ `full` }
  className={ cn('col-span-1',) }
  onValueChange={ () => {} }
  options={ selectstatusOptions }
>
</IGRPSelect></div>
  <div className={ cn('flex','flex flex-row flex-nowrap items-center justify-end gap-2','overflow-visiblestatic',)}    >
	<IGRPButton
  name={ `button1` }
  variant={ `default` }
size={ `default` }
showIcon={ true }
iconName={ `Search` }
  className={ cn('',) }
  onClick={ () => formform1Ref.current?.submit() }
  
>
  Pesquisar
</IGRPButton></div>
</>
</IGRPForm></div></div>
  );
}
