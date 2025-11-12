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
  IGRPForm,
	IGRPIcon,
	IGRPText,
	IGRPSeparator,
	IGRPSelect,
	IGRPDatePicker,
	IGRPTextarea,
	IGRPButton 
} from "@igrp/igrp-framework-react-design-system";
import {AddMemberBody} from '@/app/(myapp)/types/member'
import {AddMemberPayload} from '@/app/(myapp)/types/member'
import {getCountryAndOrgsById} from '@/app/(myapp)/functions/countries-orgs'
import {CountryOrgResponse} from '@/app/(myapp)/types/country'
import {useGetGeography} from '@/app/(myapp)/hooks/geography'
import {useGetDomain} from '@/app/(myapp)/hooks/domain'
import {getMemberById} from '@/app/(myapp)/functions/members'
import { ApiError } from '@/app/(myapp)/utils/api-client'

export default function Addorgmemberform({ saveAction, closeModal, orgId, memberid } : { saveAction: (data: object) => void, closeModal: () => void, orgId: string, memberid?: string }) {

  
  const form1 = z.object({
    country: z.string().optional(),
    date: z.date().optional(),
    alert: z.string().optional(),
    notes: z.string().optional()
})

type Form1ZodType = typeof form1;

const initForm1: z.infer<Form1ZodType> = {
    country: ``,
    date: undefined,
    alert: ``,
    notes: ``
}


  const formform1Ref = useRef<IGRPFormHandle<Form1ZodType> | null>(null);
  const [form1Data, setForm1Data] = useState<any>(initForm1);
  const [selectcountryOptions, setSelectcountryOptions] = useState<IGRPOptionsProps[]>([]);
  const [selectalertOptions, setSelectalertOptions] = useState<IGRPOptionsProps[]>([]);
  
const [loading, setLoading] = useState<boolean>(true);

const [org, setOrg] = useState<CountryOrgResponse | undefined>(undefined);

const [orgName, setOrgName] = useState<string>('');

const { igrpToast } = useIGRPToast()

async function handleSubmit (): Promise<void  | undefined> {

  const findCountry = selectcountryOptions.find((item) => item.value === form1Data.country
);


let formattedDate = '';

if (form1Data.date) {
  const date = form1Data.date;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  formattedDate = `${year}-${month}-${day}`;
}

if(org) {
const payload: AddMemberPayload = {
  "type": "O",
  "organizationId": orgId,
  "acronym": org.acronym,
  "countryGeographyId": form1Data.country,
  "countryGeographyName": findCountry?.label || null,
  "alertLevel": form1Data.alert,
  "relationStartDate": formattedDate,
   "note": form1Data.notes
  };

  saveAction(payload);
}



}

function formatWithLeadingZero (value: string): string {

  // If it already starts with '0', return as is
if (value.startsWith('0')) return value;

// Otherwise, prefix '0'
return '0' + value;

}

function handleClose (): void {

  closeModal();

}

  const { data: countryListData } = useGetGeography('0');

  const { data: alertDomain } = useGetDomain('D_ESTADO_ALERTA');

useEffect(() => {

if(countryListData && alertDomain) {


      const filterCountryListData = countryListData.Entries.Entry.map((item) => ({
        value: formatWithLeadingZero(item.id.toString()) || '',
        label: item.nome || '',
      }));

      const sortedCountryListData = filterCountryListData.sort((a, b) =>
        a.label.localeCompare(b.label),
      );

     
if(sortedCountryListData && alertDomain && org) {
  setSelectcountryOptions(sortedCountryListData);
  setSelectalertOptions(alertDomain);

   if (memberid) {
      fetchData();
    }else {
      setLoading(false);
    }
}
     
}
}, [countryListData, alertDomain, org, memberid])


useEffect(() => {
  const fetchOrg = async () => {
    const fetchOrgRes =  await getCountryAndOrgsById('O', orgId);

    setOrgName(fetchOrgRes.name);
    setOrg(fetchOrgRes);

  }

  fetchOrg()
},[])


const fetchData = async () => {
     
     getMemberById('O', orgId, memberid || '').then((res) => {
         let countryId = '';

        if(res?.countryGeographyId) {
            const stringId = String(res?.countryGeographyId);
            countryId = formatWithLeadingZero(stringId);
        }

        const date = new Date(res?.relationStartDate);

         setForm1Data({
          country: countryId,
          alert: res?.alertLevel,
          notes: res?.note,
          date: date
        });

         setLoading(false);
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

     
    };



  return (
<div className={ cn('component','block',)}    >
	{ !loading && (<IGRPForm
  schema={ form1 }
  validationMode={ `onBlur` }
  gridClassName={ `grid grid-cols-1` }
formRef={ formform1Ref }
  className={ cn('',) }
  onSubmit={ (e) => {} }
  defaultValues={ form1Data }
>
  <>
  <div className={ cn('grid','grid-cols-1 ','md:grid-cols-2 ','lg:grid-cols-4 ','grid grid grid-cols-4 grid-rows-1 gap-2 justify-items-stretch items-center',' gap-4',)}    >
	<div className={ cn('flex','flex flex-row flex-nowrap items-center justify-start gap-2',' col-span-4',)}    >
	<IGRPIcon
  name={ `icon1` }
  iconName={ `Landmark` }
size={ `14` }
  className={ cn() }
  
  
>
</IGRPIcon>
<IGRPText
  name={ `text1` }
  variant={ `primary` }
weight={ `normal` }
size={ `default` }
align={ `left` }
spacing={ `normal` }
maxLines={ 3 }
  className={ cn('mb-0','block','','font-inter text-[13px] leading-6 tracking-0 word-spacing-0 text-left font-semibold not-italic no-underline normal-case',) }
  
  
>
  Organização Internacional:
</IGRPText>
<IGRPText
  name={ `text2` }
  variant={ `primary` }
weight={ `normal` }
size={ `default` }
align={ `left` }
spacing={ `normal` }
maxLines={ 3 }
  className={ cn('mb-0','font-inter text-[13px] leading-6 tracking-0 word-spacing-0 text-left font-normal not-italic no-underline normal-case',) }
  
  
>
  { orgName }
</IGRPText></div></div>
  <IGRPSeparator
  name={ `separator1` }
  orientation={ `horizontal` }
  className={ cn('my-3',) }
  
  
>
</IGRPSeparator>
  <div className={ cn('grid','grid-cols-1 ','md:grid-cols-2 ','lg:grid-cols-4 ','grid grid grid-cols-4 grid-rows-1 gap-2 justify-items-stretch items-center',' gap-4',)}    >
	<IGRPSelect
  name={ `country` }
  label={ `País` }
placeholder={ `Selecionar...` }
required={ true }
gridSize={ `full` }
selectClassName={ undefined }
  className={ cn('col-span-4','',) }
  onValueChange={ (e) => setForm1Data({...form1Data, country: e}) }
  options={ selectcountryOptions }
>
</IGRPSelect></div>
  <div className={ cn('grid','grid-cols-1 ','md:grid-cols-2 ','lg:grid-cols-4 ','grid grid grid-cols-4 grid-rows-1 gap-2 justify-items-stretch items-center',' gap-4',)}    >
	<IGRPDatePicker
  placeholder={ `Selecionar...` }
  name={ `date` }
  id={ `date` }
  label={ `Data` }
  startDate={ new Date(`1900-01-01`) }
  endDate={ new Date(`2099-12-31`) }
  required={ true }
  gridSize={ `full` }
  dateFormat={ `dd/MM/yyyy` }
  today={ new Date(`2025-01-01`) }
  defaultMonth={ new Date(`2025-01-01`) }
  startMonth={ new Date(`2025-01-01`) }
  month={ new Date(`2025-01-01`) }
  endMonth={ new Date(`2025-12-31`) }
  numberOfMonths={ 1 }
  captionLayout={ `label` }
  className={ cn('col-span-2','',) }
  onDateChange={ (value) => {setForm1Data({...form1Data, date: value})} }
/>
<IGRPSelect
  name={ `alert` }
  label={ `Nível de Alerta (Contexto Internacional)` }
placeholder={ `Selecionar...` }
required={ true }
gridSize={ `full` }
  className={ cn('col-span-2','',) }
  onValueChange={ (e) => setForm1Data({...form1Data, alert: e}) }
  options={ selectalertOptions }
>
</IGRPSelect></div>
  <IGRPTextarea
  name={ `notes` }
  label={ `Observações` }
rows={ 3 }
required={ false }
  className={ cn() }
  onChange={ (e) => setForm1Data({...form1Data, notes: e.target.value}) }
  
>
</IGRPTextarea>
  <div className={ cn('flex','flex flex-row flex-nowrap items-stretch justify-end gap-2','mt-4',)}    >
	<IGRPButton
  name={ `button1` }
  variant={ `outline` }
size={ `default` }
showIcon={ false }
  className={ cn() }
  onClick={ handleClose }
  
>
  Cancelar
</IGRPButton>
<IGRPButton
  name={ `button2` }
  variant={ `default` }
size={ `default` }
showIcon={ false }
  className={ cn() }
  onClick={ handleSubmit }
  
>
  Gravar
</IGRPButton></div>
</>
</IGRPForm>)}
{ loading && (<div className={ cn('flex','flex flex-row flex-nowrap items-stretch justify-center gap-2',)}    >
	<Progress    ></Progress></div>)}</div>
  );
}