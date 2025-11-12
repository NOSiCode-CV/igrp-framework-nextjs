'use client'

/* THIS FILE WAS GENERATED AUTOMATICALLY BY iGRP STUDIO. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { use, useState, useEffect, useRef } from 'react';
import { cn, useIGRPMenuNavigation, useIGRPToast } from '@igrp/igrp-framework-react-design-system';
import { IGRPFormHandle } from "@igrp/igrp-framework-react-design-system";
import { z } from "zod"
import {DisableDetails} from '@/app/(myapp)/components/disableDetails'
import {Progress} from '@/app/(myapp)/components/progress'
import { 
  IGRPForm,
	IGRPSeparator,
	IGRPInputText,
	IGRPDatePicker,
	IGRPTextarea,
	IGRPButton 
} from "@igrp/igrp-framework-react-design-system";
import {DisableBody} from '@/app/(myapp)/types/country'
import {DetailItem} from '@/app/(myapp)/types/customTypes'
import {getCountryAndOrgsById} from '@/app/(myapp)/functions/countries-orgs'
import {getMemberById} from '@/app/(myapp)/functions/members'

export default function Disablememberform({ saveAction, closeModal, memberId, orgId } : { saveAction: (data: object, status: string) => void, closeModal: () => void, memberId: string, orgId: string }) {

  
  const form1 = z.object({
    currentState: z.string().optional(),
    endDate: z.date().optional(),
    reason: z.string().optional()
})

type Form1ZodType = typeof form1;

const initForm1: z.infer<Form1ZodType> = {
    currentState: ``,
    endDate: undefined,
    reason: ``
}


  const formform1Ref = useRef<IGRPFormHandle<Form1ZodType> | null>(null);
  const [form1Data, setForm1Data] = useState<any>(initForm1);
  
const [loading, setLoading] = useState<boolean>(true);

const [statusDescription, setStatusDescription] = useState<string | undefined>(undefined);

const [details, setDetails] = useState<Array<DetailItem>>([   { iconName: '', label: '', value: '' },   { iconName: '', label: '', value: '' }, ]);

const { igrpToast } = useIGRPToast()

function handleClose (): void  | undefined {

  closeModal();

}

function handleSubmit (): void  | undefined {

  let formattedDate = '';

if (form1Data.endDate) {
  const date = form1Data.endDate;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  formattedDate = `${year}-${month}-${day}`;
}

const payload: DisableBody = {
 "relationEndDate":  formattedDate,
  "reason": form1Data.reason,
  };


saveAction(payload, form1Data.currentState);

}

  useEffect(() => {
    const fetchData = async () => {
      const res = await getMemberById('O', orgId, memberId);
 
      if(res) {
        setStatusDescription(res.statusDescription);
        
        const detailsData = [
          {
            iconName: 'Flag',
            label: 'Membro',
            value: res.countryGeographyName,
          },
          {
            iconName: 'CalendarDays',
            label: 'Data Início Relação',
            value: res.relationStartDate,
          }
        ]

        setDetails(detailsData);


        setForm1Data({
          currentState: res.status
        })


        setLoading(false);
      }
    
    };

    if (memberId && orgId) {
      fetchData();
    }
  }, [orgId, memberId]);





  return (
<div className={ cn('component',)}    >
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
  <DisableDetails  details={ details }   ></DisableDetails>
  <IGRPSeparator
  name={ `separator1` }
  orientation={ `horizontal` }
  className={ cn('my-3',) }
  
  
>
</IGRPSeparator>
  <div className={ cn('grid','grid-cols-1 ','md:grid-cols-2 ','lg:grid-cols-4 ',' gap-4',)}    >
	<IGRPInputText
  name={ `currentState` }
  label={ `Status atual` }
showIcon={ false }
required={ false }
disabled={ true }
  className={ cn('col-span-1',) }
  
  value={ statusDescription }
>
</IGRPInputText>
<IGRPDatePicker
  placeholder={ `Selecionar...` }
  name={ `endDate` }
  id={ `endDate` }
  label={ `Data Término` }
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
  className={ cn() }
  onDateChange={ (value) => {setForm1Data({...form1Data, endDate: value})} }
/></div>
  <IGRPTextarea
  name={ `reason` }
  label={ `Motivo` }
rows={ 3 }
required={ true }
  className={ cn() }
  onChange={ (e) => {setForm1Data({...form1Data, reason: e.target.value})} }
  
>
</IGRPTextarea>
  <div className={ cn('flex','flex flex-row flex-nowrap items-baseline justify-end gap-2',)}    >
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