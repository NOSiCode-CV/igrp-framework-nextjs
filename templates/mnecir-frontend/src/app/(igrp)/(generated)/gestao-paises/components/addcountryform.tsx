'use client';

/* THIS FILE WAS GENERATED AUTOMATICALLY BY iGRP STUDIO. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { use, useState, useEffect, useRef } from 'react';
import { cn, useIGRPMenuNavigation, useIGRPToast } from '@igrp/igrp-framework-react-design-system';
import { IGRPFormHandle } from '@igrp/igrp-framework-react-design-system';
import { z } from 'zod';
import { IGRPOptionsProps } from '@igrp/igrp-framework-react-design-system';
import { Progress } from '@/app/(myapp)/components/progress';
import {
  IGRPForm,
	IGRPInputText,
	IGRPSelect,
	IGRPDatePicker,
	IGRPTextarea,
	IGRPButton 
} from "@igrp/igrp-framework-react-design-system";
import {AddCountryBody} from '@/app/(myapp)/types/country'
import { useGetGeography } from '@/app/(myapp)/hooks/geography'
import { useGetDomain} from '@/app/(myapp)/hooks/domain'
import {getCountryAndOrgsById} from '@/app/(myapp)/functions/countries-orgs'

export default function Addcountryform({ saveAction, id, closeModal } : { saveAction: (data: object) => void, id?: string, closeModal: () => void }) {

  
  const form1 = z.object({
    designation: z.string().optional(),
    country: z.string().optional(),
    geographicArea: z.string().optional(),
    relationStartDate: z.date().optional(),
    alert: z.string().optional(),
    observations: z.string().optional()
})

type Form1ZodType = typeof form1;

const initForm1: z.infer<Form1ZodType> = {
    designation: ``,
    country: ``,
    geographicArea: ``,
    relationStartDate: undefined,
    alert: ``,
    observations: ``
}


  const formform1Ref = useRef<IGRPFormHandle<Form1ZodType> | null>(null);
  const [form1Data, setForm1Data] = useState<any>(initForm1);
  const [selectcountryOptions, setSelectcountryOptions] = useState<IGRPOptionsProps[]>([]);
  const [selectgeographicAreaOptions, setSelectgeographicAreaOptions] = useState<
    IGRPOptionsProps[]
  >([]);
  const [selectalertOptions, setSelectalertOptions] = useState<IGRPOptionsProps[]>([]);

const { igrpToast } = useIGRPToast()

const [loading, setLoading] = useState<boolean>(false);

function handleSubmit (): void  | undefined {

  
const findCountry = selectcountryOptions.find((item) => item.value === form1Data.country
);


let formattedDate = '';

if (form1Data.relationStartDate) {
  const date = form1Data.relationStartDate;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  formattedDate = `${year}-${month}-${day}`;
}

 
const payload: AddCountryBody = {
  "type": "P",
  "name": form1Data.designation,
  "acronym": null,
  "geographicalArea": form1Data.geographicArea,
  "countryGeographyId": form1Data.country,
  "countryGeographyName": findCountry?.label || '',
  "relationStartDate": formattedDate,
  "alertLevel": form1Data.alert,
  "note": form1Data.observations
  };

saveAction(payload);


}

function handleCloseModal (): void  | undefined {

  closeModal();

}

function formatWithLeadingZero (value: string): string {

   // If it already starts with '0', return as is
if (value.startsWith('0')) return value;

// Otherwise, prefix '0'
return '0' + value;

}


  const { data: countryListData } = useGetGeography('0');
  const { data: countryDomain } = useGetDomain('D_AREA_GEOGRAFICA');
  const { data: alertDomain } = useGetDomain('D_ESTADO_ALERTA');

  const fetchData = async () => {
     
      const res = await getCountryAndOrgsById('P', id || '');
   
       
        let countryId = '';

        if(res?.geographyId) {
          const stringId = String(res?.geographyId);
          countryId = formatWithLeadingZero(stringId);
        }

        const date = new Date(res?.relationStartDate);
        setForm1Data({
          designation: res?.name,
          geographicArea: res?.geographicalArea,
          country: countryId,
          alert: res?.alertLevel,
          observations: res?.note,
          relationStartDate: date
        });

      

      setLoading(false);
    };

 useEffect(() => {
    if (countryListData && countryDomain && alertDomain) {
      

      const filterCountryListData = countryListData.Entries.Entry.map((item) => ({
        value:  formatWithLeadingZero(item.id.toString()) || '',
        label: item.nome || '',
      }));

      const sortedCountryListData = filterCountryListData.sort((a, b) =>
        a.label.localeCompare(b.label),
      );

      if ( sortedCountryListData) {
        setSelectcountryOptions(sortedCountryListData);
        setSelectgeographicAreaOptions(countryDomain);
        setSelectalertOptions(alertDomain);
          

        if (id) {
          fetchData();
        }else {
          setLoading(false);
        }
      }
    }
  }, [id, countryListData, countryDomain, alertDomain]);







  return (
<div className={ cn('component','block',)}    >
	{ !loading && (<IGRPForm
  schema={ form1 }
  validationMode={ `onBlur` }
  gridClassName={ `grid grid-cols-1` }
formRef={ formform1Ref }
  className={ cn('','block','font-inter text-base leading-6 tracking-0 word-spacing-0 text-left font-normal not-italic no-underline normal-case',) }
  onSubmit={ (e) => {} }
  defaultValues={ form1Data }
>
  <>
  <div className={ cn('grid','grid-cols-1 ','md:grid-cols-2 ','lg:grid-cols-4 ','grid grid grid-cols-4 grid-rows-1 gap-2 justify-items-stretch items-center',' gap-4',)}    >
	<IGRPInputText
  name={ `designation` }
  label={ `Designação` }
showIcon={ false }
required={ true }
  className={ cn('col-span-4','','block','',) }
  onChange={ (e) => setForm1Data({...form1Data,
  designation: e.target.value})
 }
  
>
</IGRPInputText></div>
  <div className={ cn('grid','grid-cols-1 ','md:grid-cols-2 ','lg:grid-cols-4 ','grid grid grid-cols-4 grid-rows-1 gap-2 justify-items-stretch items-start',' gap-4',)}    >
	<IGRPSelect
  name={ `country` }
  label={ `País (Geografia)` }
placeholder={ `Selecionar...` }
required={ true }
gridSize={ `full` }
showSearch={ true }
  className={ cn('col-span-2','',) }
  onValueChange={ (e) => setForm1Data({...form1Data, country: e}) }
  options={ selectcountryOptions }
>
</IGRPSelect>
<IGRPSelect
  name={ `geographicArea` }
  label={ `Área Geográfica` }
placeholder={ `Selecionar...` }
required={ true }
gridSize={ `full` }
value={ undefined }
  className={ cn('col-span-2','',) }
  onValueChange={ (e) => setForm1Data({...form1Data, geographicArea: e}) }
  options={ selectgeographicAreaOptions }
>
</IGRPSelect></div>
  <div className={ cn('grid','grid-cols-1 ','md:grid-cols-2 ','lg:grid-cols-4 ','grid grid grid-cols-4 grid-rows-1 gap-2 justify-items-stretch items-center',' gap-4',)}    >
	<IGRPDatePicker
  placeholder={ `Selecionar...` }
  name={ `relationStartDate` }
  id={ `relationStartDate` }
  label={ `Inicio Relações Diplomáticas` }
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
  onDateChange={ (value) => setForm1Data({...form1Data, relationStartDate: value}) }
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
  name={ `observations` }
  label={ `Observações` }
rows={ 3 }
required={ false }
  className={ cn() }
  onChange={ (e) => setForm1Data({...form1Data, observations: e.target.value}) }
  
>
</IGRPTextarea>
  <div className={ cn('flex','flex flex-row flex-nowrap items-stretch justify-end gap-2','mt-4 mb-4 my-4',)}    >
	<IGRPButton
  name={ `button2` }
  variant={ `outline` }
size={ `default` }
showIcon={ false }
  className={ cn() }
  onClick={ handleCloseModal }
  
>
  Cancelar
</IGRPButton>
<IGRPButton
  name={ `button1` }
  variant={ `default` }
size={ `default` }
showIcon={ false }
iconName={ `Save` }
  className={ cn('',) }
  onClick={ handleSubmit }
  
>
  Gravar
</IGRPButton></div>
</>
</IGRPForm>)}
{ loading && (<div className={ cn('flex','flex flex-row flex-nowrap items-center justify-center gap-2',)}    >
	<Progress    ></Progress></div>)}</div>
  );
}
