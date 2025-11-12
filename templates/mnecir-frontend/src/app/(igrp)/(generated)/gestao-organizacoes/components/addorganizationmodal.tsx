'use client'

/* THIS FILE WAS GENERATED AUTOMATICALLY BY iGRP STUDIO. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { use, useState, useEffect, useRef } from 'react';
import { cn, useIGRPMenuNavigation, useIGRPToast } from '@igrp/igrp-framework-react-design-system';
import AddOrganizationForm from '@/app/(igrp)/(generated)/gestao-organizacoes/components/addorganizationform'
import { 
  IGRPModalDialog,
	IGRPModalDialogContent,
	IGRPHeadline,
	IGRPModalDialogTrigger,
	IGRPButton 
} from "@igrp/igrp-framework-react-design-system";
import {createCountryAndOrgs} from '@/app/(myapp)/functions/countries-orgs'
import {getCountryAndOrgs} from '@/app/(myapp)/functions/countries-orgs'
import { ApiError } from '@/app/(myapp)/utils/api-client'
import { useOrgsTableStore} from '@/app/(myapp)/store/store'

export default function Addorganizationmodal() {

  
  
  
const [openModal, setOpenModal] = useState<boolean>(false);

const { igrpToast } = useIGRPToast()

async function handleSave (data: any): Promise<void  | undefined> {

  
  try {
    await createCountryAndOrgs('O', data);
    const res = await getCountryAndOrgs('O');
    addData(res);

    setOpenModal(false);

    igrpToast({
      type: 'success',
      title: 'Sucesso',
      description: 'Organização gravado com sucesso!',
    });

   
  } catch (err) {
    const error = err as ApiError;
    const message = error.message || 'Unexpected error occurred';

    igrpToast({
      type: 'error',
      title: `Erro ${error.status}`,
      description: message,
    });
  }



}

const addData = useOrgsTableStore((state) => state.addData);


  return (
<div className={ cn('component',)}    >
	<IGRPModalDialog
  onOpenChange={ setOpenModal
 }
  open={ openModal }
>
  <IGRPModalDialogContent
  size={ `md` }
  className={ cn('','min-w-[50%] overflow-visible',) }
  
  
>
  <IGRPHeadline
  name={ `headline1` }
  title={ `Inserir Organização Internacional` }
description={ undefined }
variant={ `h5` }
roleColor={ `solid` }
color={ `primary` }
showIcon={ false }
  className={ cn('','','font-inter text-base leading-6 tracking-0 word-spacing-0 text-left font-normal not-italic no-underline normal-case',) }
  
  
>
</IGRPHeadline>
  <AddOrganizationForm   closeModal={ () => setOpenModal(false)
 }
saveAction={ handleSave } ></AddOrganizationForm>
</IGRPModalDialogContent>
  <IGRPModalDialogTrigger
  name={ `modalDialogTrigger1` }
  
  className={ cn() }
  onClick={ () => {} }
  
>
  <IGRPButton
  name={ `button1` }
  variant={ `default` }
size={ `default` }
showIcon={ false }
  onClick={ () => {setOpenModal(true)
} }
  
>
  Adicionar Organização
</IGRPButton>
</IGRPModalDialogTrigger>
</IGRPModalDialog></div>
  );
}
