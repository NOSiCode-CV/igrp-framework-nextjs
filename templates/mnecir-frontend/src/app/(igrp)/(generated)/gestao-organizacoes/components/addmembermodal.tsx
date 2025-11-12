'use client'

/* THIS FILE WAS GENERATED AUTOMATICALLY BY iGRP STUDIO. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { use, useState, useEffect, useRef } from 'react';
import { cn, useIGRPMenuNavigation, useIGRPToast } from '@igrp/igrp-framework-react-design-system';
import AddOrgMemberForm from '@/app/(igrp)/(generated)/gestao-organizacoes/components/addorgmemberform'
import { 
  IGRPModalDialog,
	IGRPModalDialogContent,
	IGRPModalDialogHeader,
	IGRPModalDialogTitle,
	IGRPModalDialogDescription,
	IGRPModalDialogTrigger,
	IGRPButton 
} from "@igrp/igrp-framework-react-design-system";
import {createMember} from '@/app/(myapp)/functions/members'
import {getMembers} from '@/app/(myapp)/functions/members'
import { ApiError } from '@/app/(myapp)/utils/api-client'
import { useMembersTableStore} from '@/app/(myapp)/store/store'

export default function Addmembermodal({ id } : { id: string }) {

  
  
  
const [openModal, setOpenModal] = useState<boolean>(false);

const { igrpToast } = useIGRPToast()

async function handleSave (data: any): Promise<void  | undefined> {

   try {
    const payload = {
      countryGeographyId: data.countryGeographyId,
      countryGeographyName: data.countryGeographyName,
      alertLevel: data.alertLevel,
      relationStartDate: data.relationStartDate,
      organizationId: data.organizationId,
      note: data.note,
      name: data.countryGeographyName,
      type: data.type,
      acronym: data.acronym,
    };

    // Create the member
    await createMember(data.type, data.organizationId, payload);

    // Fetch updated list
    const params = {
      type: data.type,
      organizationId: data.organizationId,
    };

    const res = await getMembers('O', params);

    addData(res);

    igrpToast({
      type: 'success',
      title: 'Sucesso',
      description: 'Membro gravado com sucesso!',
    });

    setOpenModal(false);

  } catch (err) {
    const error = err as ApiError;
    const message = error?.message || 'Unexpected error occurred';

    igrpToast({
      type: 'error',
      title: `Erro ${error?.status || ''}`,
      description: message,
    });
  }

}

const addData = useMembersTableStore((state) => state.addData);


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
  <     >
	<IGRPModalDialogHeader
  
  
>
  <IGRPModalDialogTitle
  
  
  
>
  Inserir Membro da Organização
</IGRPModalDialogTitle>
  <IGRPModalDialogDescription
  
  
  
>
</IGRPModalDialogDescription>
</IGRPModalDialogHeader>
<AddOrgMemberForm  orgId={ id }  saveAction={ handleSave }
closeModal={ () => setOpenModal(false)
 } ></AddOrgMemberForm></>
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
  Adicionar Membro
</IGRPButton>
</IGRPModalDialogTrigger>
</IGRPModalDialog></div>
  );
}