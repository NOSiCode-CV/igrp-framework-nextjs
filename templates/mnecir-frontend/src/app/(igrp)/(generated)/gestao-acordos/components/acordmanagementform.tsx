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
import {UploadState} from '@/app/(myapp)/components/upload-state'
import { 
  IGRPPageHeader,
	IGRPButton,
	IGRPCard,
	IGRPCardHeader,
	IGRPCardContent,
	IGRPForm,
	IGRPSelect,
	IGRPInputText,
	IGRPInputNumber,
	IGRPDatePicker,
	IGRPTextarea,
	IGRPFormList,
	IGRPInputHidden,
	IGRPInputFile,
	IGRPCardFooter 
} from "@igrp/igrp-framework-react-design-system";
import {createOrUpdateAccord} from '@/app/(myapp)/functions/accords'
import {uploadDocument} from '@/app/(myapp)/hooks/accords-management'
import {UploadingState} from '@/app/(myapp)/types/index'
import {UploadingFiles} from '@/app/(myapp)/types/index'
import {useGetDomainAccord} from '@/app/(myapp)/hooks/domain'
import {getAllCountryAndOrgsAsMap} from '@/app/(myapp)/functions/countries-orgs'

export default function Acordmanagementform({ isEdit, initialData } : { isEdit?: boolean, initialData?: any }) {

  
  const form1 = z.object({
    type: z.string().nonempty(),
    title: z.string().optional(),
    year: z.number().optional(),
    nature: z.string().optional(),
    domain: z.string().optional(),
    phase: z.string().optional(),
    signatureDate: z.date().optional(),
    boPublicationDate: z.date().optional(),
    boReference: z.string().optional(),
    needRatification: z.string().optional(),
    ratified: z.string().optional(),
    observationRatification: z.string().optional(),
    effectiveDate: z.date().optional(),
    effectiveDateReference: z.string().optional(),
    formOfApproval: z.string().optional(),
    observations: z.string().optional(),
    countryOrganizations: z.array(z.object({ countryOrgDescription: z.string().optional(), id: z.number().optional(), countryOrgId: z.number().optional() })).optional(),
    attachments: z.array(z.object({ documentType: z.string().optional(), documentName: z.string().optional(), id: z.string().optional(), documentUrl: z.string().optional() })).optional()
})

type Form1ZodType = typeof form1;

const initForm1: z.infer<Form1ZodType> = {
    type: ``,
    title: ``,
    year: undefined,
    nature: ``,
    domain: ``,
    phase: ``,
    signatureDate: undefined,
    boPublicationDate: undefined,
    boReference: ``,
    needRatification: ``,
    ratified: ``,
    observationRatification: ``,
    effectiveDate: undefined,
    effectiveDateReference: ``,
    formOfApproval: ``,
    observations: ``,
    countryOrganizations: [{ countryOrgDescription: ``, id: undefined, countryOrgId: undefined }],
    attachments: [{ documentType: ``, documentName: ``, id: ``, documentUrl: `` }]
}


  const formform1Ref = useRef<IGRPFormHandle<Form1ZodType> | null>(null);
  const [form1Data, setForm1Data] = useState<any>(initForm1);
  const [selecttypeOptions, setSelecttypeOptions] = useState<IGRPOptionsProps[]>([]);
  const [selectnatureOptions, setSelectnatureOptions] = useState<IGRPOptionsProps[]>([]);
  const [selectdomainOptions, setSelectdomainOptions] = useState<IGRPOptionsProps[]>([]);
  const [selectphaseOptions, setSelectphaseOptions] = useState<IGRPOptionsProps[]>([]);
  const [selectneedRatificationOptions, setSelectneedRatificationOptions] = useState<IGRPOptionsProps[]>([]);
  const [selectratifiedOptions, setSelectratifiedOptions] = useState<IGRPOptionsProps[]>([]);
  const [formListcountryOrganizationsDefault, setFormListcountryOrganizationsDefault] = useState<any>({});
  const [selectcountryOrgIdOptions, setSelectcountryOrgIdOptions] = useState<IGRPOptionsProps[]>([]);
  const [formListattachmentsDefault, setFormListattachmentsDefault] = useState<any>({});
  const [selectdocumentTypeOptions, setSelectdocumentTypeOptions] = useState<IGRPOptionsProps[]>([]);
  
const [pageHeader1Title, setPageHeader1Title] = useState<string>('Inserir Informação de Acordo, Tratado ou Convenção');

const [isUploading, setIsUploading] = useState<UploadingState>({});

const [uploadedFiles, setUploadedFiles] = useState<UploadingFiles>({});

const { igrpToast } = useIGRPToast()

async function handleSubmit (values: any): Promise<void  | undefined> {

  
  try {
    console.log(values);
    await createOrUpdateAccord({...initialData,...values});
    igrpToast({
      title: 'Success',
      description: 'Accord created successfully.',
      type: 'success',
    });
   // router.push('/accord');
  } catch (error: any) {
    igrpToast({
      title: 'Error',
      description: `An error occurred while processing the form. [${error.message}]`,
      type: 'error',
    });
    console.error(error);
  }



}

async function handleUploadFile (index: number, e: any): Promise<void  | undefined> {

  const file = e?.target?.files?.[0];
    if (!file) return;

    // Store the file in state
    setUploadedFiles((prev) => ({
      ...prev,
      [index]: { file, uploaded: false },
    }));

    // Set uploading state
    setIsUploading((prev) => ({
      ...prev,
      [index]: true,
    }));

    try {
      // Get the tipo documento from the form
      const currentFormData = formform1Ref.current?.getValues();

      // Upload the file
      const uploadResponse =await uploadDocument({ file });

      // Update the uploaded file state
      setUploadedFiles((prev: any) => ({
        ...prev,
        [index]: {
          file,
          uploaded: true,
          documentUrl: uploadResponse.attachmentId,
          documentName: uploadResponse.displayName,
        },
      }));
      // Update the form with the uploaded file URL
      const updatedDocumentos = [...(currentFormData?.attachments || [])];
      updatedDocumentos[index] = {
        ...updatedDocumentos[index],
        documentUrl: uploadResponse.attachmentId,
        documentName: uploadResponse.displayName,
      };

      setForm1Data((prev: any) => ({
        ...prev,
        ...currentFormData,
        attachments: updatedDocumentos,
      }));

      igrpToast({
        title: 'Sucesso',
        description: 'Arquivo enviado com sucesso!',
        type: 'success',
      });
    } catch (error) {
      igrpToast({
        title: 'Erro',
        description: 'Erro ao enviar arquivo. Tente novamente.',
        type: 'error',
      });

      // Remove the file from state on error
      setUploadedFiles((prev) => {
        const newState = { ...prev };
        delete newState[index];
        return newState;
      });
    } finally {
      // Clear uploading state
      setIsUploading((prev) => ({
        ...prev,
        [index]: false,
      }));
    }

}


const {
  isLoading,
  tipoOptions,
  natOptions,
  domainOptions,
  phaseOptions,
  yesNoOptions,
  documentTypeOptions
} = useGetDomainAccord();

useEffect(() => {
  setPageHeader1Title(`${isEdit ? 'Editar' : 'Inserir'} Informação de Acordo, Tratado ou Convenção`)

  if (isLoading) return;

  setSelecttypeOptions(tipoOptions);
  setSelectnatureOptions(natOptions);
  setSelectdomainOptions(domainOptions);
  setSelectphaseOptions(phaseOptions);
  setSelectneedRatificationOptions(yesNoOptions);
  setSelectratifiedOptions(yesNoOptions);
  setSelectdocumentTypeOptions(documentTypeOptions);


  const fetchCountriesOrgs = async () => {
    try {
      const response = await getAllCountryAndOrgsAsMap('');

      setSelectcountryOrgIdOptions(response);


    } catch (error) {
      console.error("Erro ao carregar países e organizações:", error);
    }
  };

  fetchCountriesOrgs();

}, [isLoading]);

useEffect(() => {
  if (initialData) {
    setForm1Data({
      ...initialData,
      signatureDate: initialData.signatureDate
        ? new Date(initialData.signatureDate)
        : undefined,
      boPublicationDate: initialData.boPublicationDate
        ? new Date(initialData.boPublicationDate)
        : undefined,
      effectiveDate: initialData.effectiveDate
        ? new Date(initialData.effectiveDate)
        : undefined,
    });
  }
}, [initialData]);





  return (
<div className={ cn('component',)}    >
	<div className={ cn('section',' space-y-6',)}    >
	<IGRPPageHeader
  name={ `pageHeader1` }
  iconBackButton={ `ArrowLeft` }
  showBackButton={ true }
  urlBackButton={ `/gestao-acordos` }
  variant={ `h3` }
  title={ pageHeader1Title }
>
  <div className="flex items-center gap-2">
    <IGRPButton
  name={ `button2` }
  variant={ `secondary` }
size={ `default` }
showIcon={ false }
  className={ cn() }
  onClick={ () => {} }
  
>
  Cancelar
</IGRPButton>
    <IGRPButton
  name={ `button1` }
  variant={ `default` }
size={ `default` }
showIcon={ false }
iconName={ `Save` }
  className={ cn('','static',) }
  onClick={ () => formform1Ref.current?.submit() }
  
>
  Gravar
</IGRPButton>
</div>
</IGRPPageHeader>

<IGRPCard
  name={ `card1` }
  
  
  
>
  <IGRPCardHeader
  
>
</IGRPCardHeader>
  <IGRPCardContent
  
>
  <IGRPForm
  schema={ form1 }
  validationMode={ `onBlur` }
formRef={ formform1Ref }
  className={ cn('',) }
  onSubmit={ handleSubmit }
  defaultValues={ form1Data }
>
  <>
  <div className={ cn('grid','grid-cols-1 ','md:grid-cols-2 ','lg:grid-cols-4 ',' gap-4',)}    >
	<IGRPSelect
  name={ `type` }
  label={ `Tipo` }
placeholder={ `Select an option...` }
required={ true }
gridSize={ `full` }
  onValueChange={ () => {} }
  options={ selecttypeOptions }
>
</IGRPSelect>
<IGRPInputText
  name={ `title` }
  label={ `Título` }
showIcon={ false }
required={ true }
  
  
>
</IGRPInputText>
<IGRPInputNumber
  name={ `year` }
  label={ `Ano` }
max={ 9999999 }
step={ 1 }
required={ true }
  
  
>
</IGRPInputNumber>
<IGRPSelect
  name={ `nature` }
  label={ `Natureza` }
placeholder={ `Select an option...` }
required={ true }
gridSize={ `full` }
  onValueChange={ () => {} }
  options={ selectnatureOptions }
>
</IGRPSelect>
<IGRPSelect
  name={ `domain` }
  label={ `Dominio` }
placeholder={ `Select an option...` }
required={ true }
gridSize={ `full` }
  onValueChange={ () => {} }
  options={ selectdomainOptions }
>
</IGRPSelect>
<IGRPSelect
  name={ `phase` }
  label={ `Fase` }
placeholder={ `Select an option...` }
required={ true }
gridSize={ `full` }
  onValueChange={ () => {} }
  options={ selectphaseOptions }
>
</IGRPSelect>
<IGRPDatePicker
  placeholder={ `Please select a date...` }
  name={ `signatureDate` }
  id={ `signatureDate` }
  label={ `Data de assinatura` }
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
<IGRPDatePicker
  placeholder={ `Please select a date...` }
  name={ `boPublicationDate` }
  id={ `boPublicationDate` }
  label={ `Date de Publicação no BO` }
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
<IGRPInputText
  name={ `boReference` }
  label={ `Referencia do BO` }
showIcon={ false }
required={ false }
  
  
>
</IGRPInputText>
<IGRPSelect
  name={ `needRatification` }
  label={ `Exige Ratificação?` }
placeholder={ `Select an option...` }
required={ true }
gridSize={ `full` }
  onValueChange={ () => {} }
  options={ selectneedRatificationOptions }
>
</IGRPSelect>
<IGRPSelect
  name={ `ratified` }
  label={ `Ratificado?` }
placeholder={ `Select an option...` }
gridSize={ `full` }
  onValueChange={ () => {} }
  options={ selectratifiedOptions }
>
</IGRPSelect>
<IGRPTextarea
  name={ `observationRatification` }
  label={ `Observações sobre ratificação` }
rows={ 3 }
required={ false }
  
  
>
</IGRPTextarea>
<IGRPDatePicker
  placeholder={ `Please select a date...` }
  name={ `effectiveDate` }
  id={ `effectiveDate` }
  label={ `Entrada em Vigor` }
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
<IGRPInputText
  name={ `effectiveDateReference` }
  label={ `Referência entrada em vigor` }
showIcon={ false }
required={ false }
  
  
>
</IGRPInputText></div>
  <div className={ cn('grid','grid-cols-2 ','overflow-visiblestatic',' gap-4',)}    >
	<IGRPTextarea
  name={ `formOfApproval` }
  label={ `Forma de aprovação` }
rows={ 3 }
required={ false }
  className={ cn('col-span-1',) }
  
  
>
</IGRPTextarea>
<IGRPTextarea
  name={ `observations` }
  label={ `Observações` }
rows={ 3 }
required={ false }
  className={ cn('col-span-1',) }
  
  
>
</IGRPTextarea></div>
  <div className={ cn('grid','grid-cols-1 ','md:grid-cols-2 ','lg:grid-cols-2 ',' gap-4',)}    >
	<IGRPFormList
  id={ `formlist_hhfqd0` }
  name={ `countryOrganizations` }
  label={ `País / Organização internacional` }
  color={ `primary` }
  variant={ `solid` }
  addButtonLabel={ `Add` }
  addButtonIconName={ `Plus` }
renderItem={ (_: any, index: number) => (
      <>
        <IGRPInputHidden
  name={ `countryOrganizations.${index}.inputHidden2` }
  label={ `countryOrgDescription` }
required={ false }
  className={ cn() }
  
  
>
</IGRPInputHidden>
        <IGRPInputHidden
  name={ `countryOrganizations.${index}.inputHidden1` }
  label={ `id` }
required={ false }
  className={ cn() }
  
  
>
</IGRPInputHidden>
        <IGRPSelect
  name={ `countryOrganizations.${index}.countryOrgId` }
  label={ `País / Organização Internacional` }
placeholder={ `Select an option...` }
required={ true }
gridSize={ `full` }
  className={ cn() }
  onValueChange={ () => {} }
  options={ selectcountryOrgIdOptions }
>
</IGRPSelect>
</>
    )
  }
  computeLabel={
    (item: any, index: number) => `Item ${index}`
  }
  className={ cn('','col-span-1',) }
  
  defaultItem={ formListcountryOrganizationsDefault }
>
</IGRPFormList>

<IGRPFormList
  id={ `formlist_3f9j92` }
  name={ `attachments` }
  label={ `Documentos` }
  color={ `primary` }
  variant={ `solid` }
  addButtonLabel={ `Add` }
  addButtonIconName={ `Plus` }
renderItem={ (_: any, index: number) => (
      <>
        <div className={ cn('grid','grid-cols-1 ','md:grid-cols-2 ','lg:grid-cols-2 ','overflow-visibleborder border-solid border-[#000000]relative',' gap-4',)}    >
	<IGRPSelect
  name={ `attachments.${index}.documentType` }
  label={ `Tipo de Documento` }
placeholder={ `Select an option...` }
required={ true }
gridSize={ `full` }
  className={ cn('col-span-1',) }
  onValueChange={ () => {} }
  options={ selectdocumentTypeOptions }
>
</IGRPSelect>
<IGRPInputFile
  name={ `attachments.${index}.inputFile1` }
  label={ `Documento` }
accept={ `application/pdf` }
required={ true }
  className={ cn('col-span-1',) }
  onChange={ (e)=>handleUploadFile(index, e) }
  
>
</IGRPInputFile>
<IGRPInputHidden
  name={ `attachments.${index}.documentName` }
  label={ `documentName` }
required={ false }
  className={ cn('col-span-1',) }
  
  
>
</IGRPInputHidden>
<IGRPInputHidden
  name={ `attachments.${index}.inputHidden3` }
  label={ `id` }
required={ false }
  className={ cn('col-span-1',) }
  
  
>
</IGRPInputHidden>
<IGRPInputHidden
  name={ `attachments.${index}.documentUrl` }
  label={ `url` }
required={ false }
  className={ cn('col-span-1',) }
  
  
>
</IGRPInputHidden>
<UploadState  isUploading={ isUploading } uploadedFiles={ uploadedFiles } index={ index }   ></UploadState></div>
</>
    )
  }
  computeLabel={
    (item: any, index: number) => `Item ${index}`
  }
  className={ cn('','col-span-1',) }
  
  defaultItem={ formListattachmentsDefault }
>
</IGRPFormList>
</div>
</>
</IGRPForm>
</IGRPCardContent>
  <IGRPCardFooter
  
>
</IGRPCardFooter>
</IGRPCard></div></div>
  );
}
