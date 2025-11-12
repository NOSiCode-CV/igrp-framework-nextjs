'use client'

/* THIS FILE WAS GENERATED AUTOMATICALLY BY iGRP STUDIO. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { use, useState, useEffect, useRef } from 'react';
import { cn, useIGRPMenuNavigation, useIGRPToast } from '@igrp/igrp-framework-react-design-system';
import AddMemberModal from '@/app/(igrp)/(generated)/gestao-organizacoes/components/addmembermodal'
import MemberFilterBar from '@/app/(igrp)/(generated)/gestao-organizacoes/components/memberfilterbar'
import MemberList from '@/app/(igrp)/(generated)/gestao-organizacoes/components/memberlist'
import { 
  IGRPPageHeader 
} from "@igrp/igrp-framework-react-design-system";
import {getMembers} from '@/app/(myapp)/functions/members'
import { useMembersTableStore} from '@/app/(myapp)/store/store'
import { ApiError } from '@/app/(myapp)/utils/api-client'


export default function PageOrganizationmembersmanagementComponent({ params } : { params: Promise<{ slug: string }> } ) {

  const { slug } = use(params);

  const { igrpToast } = useIGRPToast();  
  
  
const addData = useMembersTableStore((state) => state.addData);

useEffect(() => {
  const fetchData = async () => {
    const params =  {
      type: "O",
      organizationId: +slug
  }

 getMembers('O', params).then((res) => {
   addData(res);
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


  }

  fetchData();
},[])


  return (
<div className={ cn('page','space-y-6',)}    >
	<div className={ cn('section',' space-y-6 space-x-6',)}    >
	<IGRPPageHeader
  name={ `pageHeaderMembers` }
  title={ `Membros da Organização` }
  iconBackButton={ `ArrowLeft` }
  variant={ `h3` }
>
  <div className="flex items-center gap-2">
    <AddMemberModal  id={ slug }   ></AddMemberModal>
</div>
</IGRPPageHeader>
</div>
<div className={ cn('section','pr-4 pl-4 px-4',' space-y-6 space-x-6',)}    >
	<MemberFilterBar  orgId={ +slug }   ></MemberFilterBar>
<MemberList  orgId={ slug }   ></MemberList></div></div>
  );
}
