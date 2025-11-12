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
import {DisableDetailsProps} from '@/app/(myapp)/types/customTypes'
import {DetailItem} from '@/app/(myapp)/types/customTypes'
import {getCountryAndOrgsById} from '@/app/(myapp)/functions/countries-orgs'

export default function Disablecountryandorganizationform({ saveAction, id, closeModal } : { saveAction: (data: object, status: string) => void, id?: string, closeModal: () => void }) {

  
  const form1 = z.object({
    statusDescription: z.string().optional(),
    endDate: z.date().optional(),
    reason: z.string().optional()
})

type Form1ZodType = typeof form1;

const initForm1: z.infer<Form1ZodType> = {
    statusDescription: ``,
    endDate: undefined,
    reason: ``
}


  const formform1Ref = useRef<IGRPFormHandle<Form1ZodType> | null>(null);
  const [form1Data, setForm1Data] = useState<any>(initForm1);
  
const [loading, setLoading] = useState<boolean>(true);

const [currentStatus, setCurrentStatus] = useState<string>('');

const [details, setDetails] = useState<Array<DetailItem>>([   { iconName: '', label: '', value: '' },   { iconName: '', label: '', value: '' }, ]);

const { igrpToast } = useIGRPToast()

function handleSubmit (): void  | undefined {

  
const payload: DisableBody = {
 "relationEndDate":  form1Data.endDate,
  "reason": form1Data.reason,
  };

saveAction(payload, currentStatus);


}

function handleClose (): void  | undefined {

  closeModal();

}

  useEffect(() => {
    const fetchData = async () => {
      const res = await getCountryAndOrgsById('P', id || '');
 
      if(res) {
        setCurrentStatus( res.status);


        const detailsData = [
          {
            iconName: 'Flag',
            label: 'País Acreditado',
            value: res.geographyName,
          },
          {
            iconName: 'CalendarDays',
            label: 'Data Início Relação',
            value: res.relationStartDate,
          }
        ]

        setDetails(detailsData);



        setForm1Data({
          statusDescription: res.statusDescription
        });

        setLoading(false);
      }
    
    };

    if (
      id 
    ) {
      fetchData();
    }
  }, [id]);


  return (
<div className={ cn('component','block',)}    >
	{ !loading && (<IGRPForm
  schema={ form1 }
  validationMode={ `onBlur` }
  gridClassName={ `grid grid-cols-1` }
formRef={ formform1Ref }
  className={ cn('','block','','font-inter text-base leading-6 tracking-0 word-spacing-0 text-left font-normal not-italic no-underline normal-case',) }
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
  <div className={ cn('grid','grid-cols-1 ','md:grid-cols-2 ','lg:grid-cols-4 ','grid grid grid-cols-4 grid-rows-1 gap-2 justify-items-stretch items-start',' gap-4',)}    >
	<IGRPInputText
  name={ `statusDescription` }
  label={ `Status atual` }
showIcon={ false }
required={ false }
disabled={ true }
  className={ cn('col-span-1','',) }
  
  
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
  className={ cn('col-span-1','',) }
  onDateChange={ (value) => {setForm1Data({...form1Data, endDate: value})} }
/></div>
  <IGRPTextarea
  name={ `reason` }
  label={ `Motivo` }
rows={ 3 }
required={ true }
  className={ cn('',) }
  onChange={ (e) => setForm1Data({...form1Data, reason: e.target.value })

 }
  
>
</IGRPTextarea>
</>
</IGRPForm>)}
{ !loading && (<div className={ cn('flex','flex flex-row flex-nowrap items-baseline justify-end gap-2','mt-4 mb-4 my-4',)}    >
	<IGRPButton
  name={ `button2` }
  variant={ `outline` }
size={ `default` }
showIcon={ false }
  className={ cn() }
  onClick={ handleClose }
  
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
</IGRPButton></div>)}
{ loading && (<div className={ cn('flex','flex flex-row flex-nowrap items-center justify-center gap-2',)}    >
	<Progress    ></Progress></div>)}</div>
  );
}
