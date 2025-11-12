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
import { getCountriesByGeoArea} from '@/app/(myapp)/functions/geography'
import {getCountryAndOrgs} from '@/app/(myapp)/functions/countries-orgs'
import { ApiError } from '@/app/(myapp)/utils/api-client'
import { useGetGeography } from '@/app/(myapp)/hooks/geography'
import { useGetDomain} from '@/app/(myapp)/hooks/domain'
import { useCountryTableStore } from '@/app/(myapp)/store/store'

export default function Countryfilterbar() {

  
  const form1 = z.object({
    geographicArea: z.string().optional(),
    country: z.string().optional(),
    alert: z.string().optional()
})

type Form1ZodType = typeof form1;

const initForm1: z.infer<Form1ZodType> = {
    geographicArea: undefined,
    country: undefined,
    alert: undefined
}


  const formform1Ref = useRef<IGRPFormHandle<Form1ZodType> | null>(null);
  const [form1Data, setForm1Data] = useState<any>(initForm1);
  const [selectgeographicAreaOptions, setSelectgeographicAreaOptions] = useState<IGRPOptionsProps[]>([]);
  const [selectcountryOptions, setSelectcountryOptions] = useState<IGRPOptionsProps[]>([]);
  const [selectalertOptions, setSelectalertOptions] = useState<IGRPOptionsProps[]>([]);
  
const [countryFilter, setCountryFilter] = useState<string>('');

const [geographicAreaFilter, setGeographicAreaFilter] = useState<string>('');

const [alertFilter, setAlertFilter] = useState<string>('');

const [countryList, setCountryList] = useState<any>([]);

const [loading, setLoading] = useState<boolean>(true);

const { igrpToast } = useIGRPToast()

async function fetchCountriesByGeoArea (code: string): Promise<void  | undefined> {

     
   setGeographicAreaFilter(code)

  const countriesData = await getCountriesByGeoArea(code);

  setSelectcountryOptions(countriesData)



}

async function handleSearch (): Promise<void  | undefined> {

  try {
  const countryDesignation = selectcountryOptions.find((item) => item.value === countryFilter);


const params = {
  name: countryDesignation?.label,
  alertLevel: alertFilter,
  geographicalArea: geographicAreaFilter
}
const res = await getCountryAndOrgs("P",params );

addData(res);


} catch(err) {
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

async function handleResetFilters (): Promise<void  | undefined> {

  setForm1Data({
  geographicArea: '',
  alert: '',
  country: ''
});

setCountryFilter('');
setGeographicAreaFilter('');
setAlertFilter('');

 const res = await getCountryAndOrgs("P");


   addData(res);

// if(res.status === 200) {

//   addData(res.data);

// }









}

const addData = useCountryTableStore((state) => state.addData);

const {data: countryListData} = useGetGeography("0");
const {data: countryDomain } = useGetDomain("D_AREA_GEOGRAFICA");
const {data: alertDomain } = useGetDomain("D_ESTADO_ALERTA");
  
useEffect(() => {

   if(countryListData && countryDomain && alertDomain) {

   

      const filterCountryListData = countryListData.Entries.Entry.map((item) => (
        {
          value: item.id || '',
          label: item.nome || ''
        }
      ));

       

      const sortedCountryListData = filterCountryListData.sort((a,b) => a.label.localeCompare(b.label));

      if(sortedCountryListData) {
        setCountryList(sortedCountryListData);
        setSelectgeographicAreaOptions(countryDomain);
        setSelectalertOptions(alertDomain);
        setLoading(false);

  

      }
   }
  
  
}, [countryListData, countryDomain, alertDomain]);



  return (
<div className={ cn('component','block','w-[100%] overflow-visible',)}    >
	{ !loading && (<div className={ cn('flex','flex flex-col flex-nowrap items-stretch justify-start gap-2','pt-10 pr-10 pb-10 pl-10 px-10 py-10','border border-solid border-[#E0E0E0] rounded-xl',)}    >
	<div className={ cn('flex','flex flex-col flex-nowrap items-stretch justify-start gap-2','w-[100%] overflow-visibleborder border-solid border-[#000000]',)}    >
	<IGRPText
  name={ `text1` }
  variant={ `primary` }
weight={ `normal` }
size={ `default` }
align={ `left` }
spacing={ `normal` }
maxLines={ 3 }
  className={ cn('','overflow-visible','font-inter text-[22px] leading-6 tracking-0 word-spacing-0 text-left font-normal not-italic no-underline normal-case',) }
  
  
>
  Filtros
</IGRPText>
<IGRPForm
  schema={ form1 }
  validationMode={ `onBlur` }
formRef={ formform1Ref }
  className={ cn() }
  onSubmit={ (e) => {} }
  defaultValues={ form1Data }
>
  <>
  <div className={ cn('grid','grid-cols-1 ','md:grid-cols-2 ','lg:grid-cols-4 ',' gap-4',)}    >
	<IGRPSelect
  name={ `geographicArea` }
  label={ `Área Geográfica` }
placeholder={ `Selecionar...` }
gridSize={ `full` }
showSearch={ true }
  className={ cn('','overflow-visible',) }
  onValueChange={ (e) => fetchCountriesByGeoArea(e)
 }
  options={ selectgeographicAreaOptions }
>
</IGRPSelect>
<IGRPSelect
  name={ `country` }
  label={ `País` }
placeholder={ `Selecionar...` }
gridSize={ `full` }
value={ undefined }
showSearch={ true }
  className={ cn('','overflow-visible',) }
  onValueChange={ (e) => setCountryFilter(e)
 }
  options={ selectcountryOptions }
>
</IGRPSelect>
<IGRPSelect
  name={ `alert` }
  label={ `Alerta` }
placeholder={ `Selecionar...` }
gridSize={ `full` }
showSearch={ true }
  className={ cn('',) }
  onValueChange={ (e) => setAlertFilter(e)
 }
  options={ selectalertOptions }
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
iconName={ `Search` }
  className={ cn('',) }
  onClick={ handleSearch }
  
>
  Filtrar países
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
