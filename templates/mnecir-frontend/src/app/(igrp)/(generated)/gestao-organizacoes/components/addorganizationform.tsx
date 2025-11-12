'use client';

/* THIS FILE WAS GENERATED AUTOMATICALLY BY iGRP STUDIO. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { use, useState, useEffect, useRef } from 'react';
import { cn, useIGRPMenuNavigation, useIGRPToast } from '@igrp/igrp-framework-react-design-system';
import { IGRPFormHandle } from "@igrp/igrp-framework-react-design-system";
import { z } from "zod"
import {Progress} from '@/app/(myapp)/components/progress'
import { 
  IGRPForm,
	IGRPInputText,
	IGRPDatePicker,
	IGRPTextarea,
	IGRPButton 
} from "@igrp/igrp-framework-react-design-system";
import {AddCountryBody} from '@/app/(myapp)/types/country'
import {AddMemberPayload} from '@/app/(myapp)/types/member'
import {getCountryAndOrgsById} from '@/app/(myapp)/functions/countries-orgs'
import { ApiError } from '@/app/(myapp)/utils/api-client'

export default function Addorganizationform({ saveAction, closeModal, id } : { saveAction: (data: object) => void, closeModal: () => void, id?: string }) {

  const { igrpToast } = useIGRPToast();

  const form1 = z.object({
    acronym: z.string().optional(),
    designation: z.string().optional(),
    startDate: z.date().optional(),
    observations: z.string().optional()
})

type Form1ZodType = typeof form1;

const initForm1: z.infer<Form1ZodType> = {
    acronym: ``,
    designation: ``,
    startDate: undefined,
    observations: ``
}


  const formform1Ref = useRef<IGRPFormHandle<Form1ZodType> | null>(null);
  const [form1Data, setForm1Data] = useState<any>(initForm1);
  
const [loading, setLoading] = useState<boolean>(true);

function handleSubmit (): void  | undefined {

  let formattedDate = '';

if (form1Data.startDate) {
  const date = form1Data.startDate;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  formattedDate = `${year}-${month}-${day}`;
}


const payload: AddCountryBody = {
  "type": "O",
  "name": form1Data.designation,
  "acronym": form1Data.acronym,
  "geographicalArea": null,
  "countryGeographyId": null,
  "countryGeographyName": null,
  "relationStartDate": formattedDate,
  "alertLevel":null,
  "note": form1Data.observations
  };

saveAction(payload);

}

function handleClose (): void  | undefined {

  closeModal();

}

const fetchData = async () => {
     
      getCountryAndOrgsById('O', id || '').then((res) => {
          const date = new Date(res?.relationStartDate);

          setForm1Data({
            startDate: date,
            acronym: res?.acronym,
            designation: res?.name,
            observations: res?.note
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

useEffect(() => {
   if (id) {
          fetchData();
        }else {
          setLoading(false);
        }
},[id])


  return (
<div className={ cn('component','block',)}    >
	{ !loading && (<IGRPForm
  schema={ form1 }
  validationMode={ `onBlur` }
  gridClassName={ `grid grid-cols-1` }
formRef={ formform1Ref }
  className={ cn() }
  onSubmit={ (e) => {} }
  defaultValues={ form1Data }
>
  <>
  <div className={ cn('grid','grid-cols-1 ','md:grid-cols-2 ','lg:grid-cols-4 ','grid grid grid-cols-4 grid-rows-1 gap-2 justify-items-stretch items-center',' gap-4',)}    >
	<IGRPInputText
  name={ `acronym` }
  label={ `Sigla` }
showIcon={ false }
required={ true }
  className={ cn('col-span-2','',) }
  onChange={ (e) => setForm1Data({...form1Data,
  acronym: e.target.value})

 }
  
>
</IGRPInputText>
<IGRPInputText
  name={ `designation` }
  label={ `Designação` }
showIcon={ false }
required={ true }
  className={ cn('col-span-2','',) }
  onChange={ (e) => setForm1Data({...form1Data, designation: e.target.value})
 }
  
>
</IGRPInputText></div>
  <div className={ cn('grid','grid-cols-1 ','md:grid-cols-2 ','lg:grid-cols-4 ','grid grid grid-cols-4 grid-rows-1 gap-2 justify-items-stretch items-center',' gap-4',)}    >
	<IGRPDatePicker
  placeholder={ `Selecionar...` }
  name={ `startDate` }
  id={ `startDate` }
  label={ `Início Relações Diplomáticas` }
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
  className={ cn('col-span-4','',) }
  onDateChange={ (value) => {setForm1Data({...form1Data, startDate: value})} }
/></div>
  <IGRPTextarea
  name={ `observations` }
  label={ `Observações` }
rows={ 3 }
required={ false }
  className={ cn() }
  onChange={ (e) => setForm1Data({...form1Data, observations: e.target.value})
 }
  
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
{ loading && (<div className={ cn('flex','flex flex-row flex-nowrap items-center justify-center gap-2',)}    >
	<Progress    ></Progress></div>)}</div>
  );
}
