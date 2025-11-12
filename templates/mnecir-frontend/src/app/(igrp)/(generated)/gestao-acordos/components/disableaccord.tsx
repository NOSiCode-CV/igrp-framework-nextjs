'use client';

/* THIS FILE WAS GENERATED AUTOMATICALLY BY iGRP STUDIO. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { use, useState, useEffect, useRef } from 'react';
import { cn, useIGRPMenuNavigation, useIGRPToast } from '@igrp/igrp-framework-react-design-system';
import { IGRPFormHandle } from '@igrp/igrp-framework-react-design-system';
import { z } from 'zod';
import {
  IGRPHeadline,
  IGRPButton,
  IGRPForm,
  IGRPText,
  IGRPSeparator,
  IGRPDatePicker,
  IGRPTextarea,
} from '@igrp/igrp-framework-react-design-system';

export default function Disableaccord({ id }: { id?: string }) {
  const formform1Ref = useRef<IGRPFormHandle<any> | null>(null);
  const [contentFormform1, setContentFormform1] = useState<z.infer<any>>(null);

  const { igrpToast } = useIGRPToast();

  return (
<div className={ cn('component',)}    >
	<div className={ cn('section',' space-y-6',)}    >
	<IGRPHeadline
  name={ `headline1` }
  title={ `Desativar Instrumento Jurídico` }
description={ undefined }
variant={ `h3` }
roleColor={ `solid` }
color={ `primary` }
showIcon={ false }
  
  
>
</IGRPHeadline>
<IGRPButton
  name={ `button1` }
  variant={ `default` }
size={ `default` }
showIcon={ false }
  onClick={ () => {} }
  
>
  Gravar
</IGRPButton></div>
<div className={ cn('section',' space-y-6',)}    >
	<IGRPForm
          validationMode={`onBlur`}
          formRef={formform1Ref}
          onSubmit={(e) => { } }
          defaultValues={contentFormform1} 
          schema={undefined}
        >
  <>
  <div className={ cn('flex',)}    >
	<IGRPText
  name={ `text2` }
  variant={ `primary` }
weight={ `normal` }
size={ `default` }
align={ `left` }
spacing={ `normal` }
maxLines={ 3 }
  className={ cn('','block','','font-inter text-base leading-6 tracking-0 word-spacing-0 text-left font-normal not-italic no-underline normal-case','border border-solid border-[#000000]','static',) }
  
  
>
  Título
</IGRPText>
<IGRPText
  name={ `text1` }
  variant={ `primary` }
weight={ `normal` }
size={ `default` }
align={ `left` }
spacing={ `normal` }
maxLines={ 3 }
  
  
>
  Data Início
</IGRPText></div>
  <IGRPSeparator
  name={ `separator2` }
  orientation={ `horizontal` }
  className={ cn('my-3',) }
  
  
>
</IGRPSeparator>
  <div className={ cn('grid','grid-cols-1 ','md:grid-cols-2 ','lg:grid-cols-4 ',' gap-4',)}    >
	<IGRPDatePicker
  placeholder={ `Please select a date...` }
  name={ `inputDatePicker1` }
  id={ `inputDatePicker1` }
  label={ `Data Término` }
  startDate={ new Date(`1900-01-01`) }
  endDate={ new Date(`2099-12-31`) }
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
  onDateChange={ (value) => {} }
/>
<IGRPTextarea
  name={ `inputTextarea1` }
  label={ `Motivo` }
rows={ 3 }
required={ false }
  
  
>
</IGRPTextarea></div>
</>
</IGRPForm></div></div>
  );
}
