'use client'

/* THIS FILE WAS GENERATED AUTOMATICALLY BY iGRP STUDIO. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { use, useState, useEffect, useRef } from 'react';
import { cn, useIGRPMenuNavigation, useIGRPToast } from '@igrp/igrp-framework-react-design-system';
import AddCountryForm from '@/app/(igrp)/(generated)/gestao-paises/components/addcountryform'
import { 
  IGRPModalDialog,
	IGRPModalDialogContent,
	IGRPHeadline,
	IGRPModalDialogTrigger,
	IGRPButton 
} from "@igrp/igrp-framework-react-design-system";
import {DomainDataResponse} from '@/app/(myapp)/types/domains'
import {createCountryAndOrgs} from '@/app/(myapp)/functions/countries-orgs'
import {getCountryAndOrgs} from '@/app/(myapp)/functions/countries-orgs'
import { ApiError } from '@/app/(myapp)/utils/api-client'
import { useCountryTableStore} from '@/app/(myapp)/store/store'

export default function Addcountrymodal() {

  
  
  
const [openModal, setOpenModal] = useState<boolean>(false);

const { igrpToast } = useIGRPToast()

async function handleSave (data: any): Promise<void  | undefined> {

  createCountryAndOrgs("P", data)
  .then(() => {
    return getCountryAndOrgs("P");
  })
  .then((res) => {
    addData(res);

    igrpToast({
      type: "success",
      title: "Sucesso",
      description: "País gravado com sucesso!",
    });

    setOpenModal(false);
  })
  .catch((err) => {
    const error = err as ApiError;
    const message = error.message || "Unexpected error occurred";

    igrpToast({
      type: "error",
      title: `Erro ${error.status}`,
      description: message,
    });
  });


}

const addData = useCountryTableStore((state) => state.addData);


  return (
<div className={ cn('component',)}    >
	<IGRPModalDialog
  onOpenChange={ setOpenModal
 }
  open={ openModal }
>
  <IGRPModalDialogContent
  size={ `md` }
  className={ cn('','block','','min-w-[50%] overflow-visible','bg-[#FFFFFF] bg-cover bg-center bg-no-repeat bg-scroll mix-blend-normal',) }
  
  
>
  <IGRPHeadline
  name={ `headline2` }
  title={ `Inserir País` }
description={ undefined }
variant={ `h5` }
roleColor={ `solid` }
color={ `primary` }
showIcon={ false }
  className={ cn('','','font-inter text-base leading-6 tracking-0 word-spacing-0 text-left font-normal not-italic no-underline normal-case',) }
  
  
>
</IGRPHeadline>
  <AddCountryForm   saveAction={ handleSave }
closeModal={ () => setOpenModal(false)
 } ></AddCountryForm>
</IGRPModalDialogContent>
  <IGRPModalDialogTrigger
  name={ `modalDialogTrigger1` }
  
  className={ cn('',) }
  onClick={ () => {} }
  
>
  <IGRPButton
  name={ `button1_copy` }
  variant={ `default` }
size={ `default` }
showIcon={ false }
iconName={ `Plus` }
iconSize={ undefined }
  className={ cn('','overflow-visible','static',) }
  onClick={ () => {setOpenModal(true)
} }
  
>
  Adicionar país
</IGRPButton>
</IGRPModalDialogTrigger>
</IGRPModalDialog></div>
  );
}
