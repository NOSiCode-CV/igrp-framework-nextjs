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
import { UploadState } from '@/app/(myapp)/components/upload-state';
import {
  IGRPForm,
  IGRPMenuNavigation,
  IGRPAlert,
  IGRPText,
  IGRPCard,
  IGRPCardHeader,
  IGRPHeadline,
  IGRPBadge,
  IGRPCardContent,
  IGRPCombobox,
  IGRPInputText,
  IGRPDatePicker,
  IGRPInputHidden,
  IGRPCardFooter,
  IGRPFormList,
  IGRPInputNumber,
  IGRPCheckbox,
  IGRPInputFile,
  IGRPTextarea,
} from '@igrp/igrp-framework-react-design-system';
import { uploadDocument } from '@/app/(myapp)/hooks/use-contribuinte';
import { UploadingState } from '@/app/(myapp)/types/index';
import { UploadingFiles } from '@/app/(myapp)/types/index';
import { useNewContribuinteParameterizations } from '@/app/(myapp)/hooks/use-parameterization';
import { useRouter } from 'next/navigation';
import { createOrUpdateContribuinte } from '@/app/(myapp)/hooks/use-contribuinte';
import { useContribuinteValidation } from '@/app/(myapp)/hooks/use-contribuinte-validation';

export default function Contribuinteform({
  isEdit,
  initialData,
  shouldSubmit,
  onAfterSubmit,
}: {
  isEdit?: boolean;
  initialData?: any;
  shouldSubmit: boolean;
  onAfterSubmit: () => void;
}) {
  const formContribuinte = z.object({
    tipoDocumento: z.string().nonempty(),
    numDocumentoInscricao: z.string().nonempty(),
    denominacaoSocial: z.string().nonempty(),
    nomeComercial: z.string().nonempty(),
    codigoEstatuto: z.string().nonempty(),
    tipoRepresentacao: z.string().nonempty(),
    nomeResponsavel: z.string().nonempty(),
    dataInicioAtividade: z.date(),
    uuidSede: z.string().optional(),
    soatUsado: z.string().optional(),
    actividadesEconomicas: z
      .array(
        z.object({
          idActividadeEconomica: z.number(),
          taxa: z.number().optional(),
          principal: z.boolean().optional(),
          id: z.number().optional(),
        }),
      )
      .optional(),
    enderecos: z
      .array(
        z.object({
          tipoEndereco: z.string().nonempty(),
          rua: z.string().nonempty(),
          pontoRef: z.string().nonempty(),
          idGeografia: z.number(),
          caixaPostal: z.string().optional(),
          numPorta: z.string().optional(),
          id: z.number().optional(),
        }),
      )
      .optional(),
    contactos: z
      .array(
        z.object({
          tipoContacto: z.string().nonempty(),
          contacto: z.string().nonempty(),
          id: z.number().optional(),
        }),
      )
      .optional(),
    dadosBancarios: z
      .array(
        z.object({
          idOperadora: z.number(),
          nib: z
            .string()
            .max(21)
            .regex(/^[0-9]+$/)
            .nonempty(),
          numConta: z
            .string()
            .regex(/^[0-9]+$/)
            .nonempty(),
          id: z.number().optional(),
        }),
      )
      .optional(),
    anexos: z
      .array(
        z.object({
          idTipoDocumento: z.number(),
          url: z.string().optional(),
          id: z.number().optional(),
        }),
      )
      .optional(),
    observacao: z.string().nonempty(),
  });

  type FormContribuinteZodType = typeof formContribuinte;

  const initFormContribuinte: z.infer<FormContribuinteZodType> = {
    tipoDocumento: ``,
    numDocumentoInscricao: ``,
    denominacaoSocial: ``,
    nomeComercial: ``,
    codigoEstatuto: ``,
    tipoRepresentacao: ``,
    nomeResponsavel: ``,
    dataInicioAtividade: new Date(),
    uuidSede: undefined,
    soatUsado: undefined,
    actividadesEconomicas: [
      { idActividadeEconomica: 0, taxa: undefined, principal: undefined, id: undefined },
    ],
    enderecos: [
      {
        tipoEndereco: ``,
        rua: ``,
        pontoRef: ``,
        idGeografia: 0,
        caixaPostal: ``,
        numPorta: ``,
        id: undefined,
      },
    ],
    contactos: [{ tipoContacto: ``, contacto: ``, id: undefined }],
    dadosBancarios: [{ idOperadora: 0, nib: ``, numConta: ``, id: undefined }],
    anexos: [{ idTipoDocumento: 0, url: ``, id: undefined }],
    observacao: ``,
  };

  const formform1Ref = useRef<IGRPFormHandle<FormContribuinteZodType> | null>(null);
  const [formContribuinteData, setFormContribuinteData] = useState<any>(initFormContribuinte);
  const [
    menuNavigationmenuNavigation1ActiveSection,
    setMenuNavigationmenuNavigation1ActiveSection,
  ] = useState<string>(``);
  const [highlighttext3Text, setHighlighttext3Text] = useState<string[]>([]);
  const [highlighttext2Text, setHighlighttext2Text] = useState<string[]>([]);
  const [selecttipoDocumentoValue, setSelecttipoDocumentoValue] = useState<string>(``);
  const [selecttipoDocumentoOptions, setSelecttipoDocumentoOptions] = useState<IGRPOptionsProps[]>(
    [],
  );
  const [selectcodigoEstatutoValue, setSelectcodigoEstatutoValue] = useState<string>(``);
  const [selectcodigoEstatutoOptions, setSelectcodigoEstatutoOptions] = useState<
    IGRPOptionsProps[]
  >([]);
  const [selecttipoRepresentacaoValue, setSelecttipoRepresentacaoValue] = useState<string>(``);
  const [selecttipoRepresentacaoOptions, setSelecttipoRepresentacaoOptions] = useState<
    IGRPOptionsProps[]
  >([]);
  const [highlighttext1Text, setHighlighttext1Text] = useState<string[]>([]);
  const [selectuuidSedeValue, setSelectuuidSedeValue] = useState<string>(``);
  const [selectuuidSedeOptions, setSelectuuidSedeOptions] = useState<IGRPOptionsProps[]>([]);
  const [formListactividadesEconomicasDefault, setFormListactividadesEconomicasDefault] =
    useState<any>({});
  const [selectidActividadeEconomicaValue, setSelectidActividadeEconomicaValue] =
    useState<string>(``);
  const [selectidActividadeEconomicaOptions, setSelectidActividadeEconomicaOptions] = useState<
    IGRPOptionsProps[]
  >([]);
  const [formListenderecosDefault, setFormListenderecosDefault] = useState<any>({});
  const [selecttipoEnderecoValue, setSelecttipoEnderecoValue] = useState<string>(``);
  const [selecttipoEnderecoOptions, setSelecttipoEnderecoOptions] = useState<IGRPOptionsProps[]>(
    [],
  );
  const [selectidGeografiaValue, setSelectidGeografiaValue] = useState<string>(``);
  const [selectidGeografiaOptions, setSelectidGeografiaOptions] = useState<IGRPOptionsProps[]>([]);
  const [formListformList1Default, setFormListformList1Default] = useState<any>({});
  const [selecttipoContactoValue, setSelecttipoContactoValue] = useState<string>(``);
  const [selecttipoContactoOptions, setSelecttipoContactoOptions] = useState<IGRPOptionsProps[]>(
    [],
  );
  const [formListdadosBancariosDefault, setFormListdadosBancariosDefault] = useState<any>({});
  const [selectidOperadoraValue, setSelectidOperadoraValue] = useState<string>(``);
  const [selectidOperadoraOptions, setSelectidOperadoraOptions] = useState<IGRPOptionsProps[]>([]);
  const [formListanexosDefault, setFormListanexosDefault] = useState<any>({});
  const [selectidTipoDocumentoValue, setSelectidTipoDocumentoValue] = useState<string>(``);
  const [selectidTipoDocumentoOptions, setSelectidTipoDocumentoOptions] = useState<
    IGRPOptionsProps[]
  >([]);

  const [actividadesEconomicasBadgeValue, setActividadesEconomicasBadgeValue] =
    useState<string>('SOAT Ponderado: 0.00%');

  const [actividadesEconomicas, setActividadesEconomicas] = useState<any>(undefined);

  const [menuNavigation1BadgeContent, setMenuNavigation1BadgeContent] = useState<string>('Novo');

  const [isUploading, setIsUploading] = useState<UploadingState>({});

  const [uploadedFiles, setUploadedFiles] = useState<UploadingFiles>({});

  const { igrpToast } = useIGRPToast();

  const { getSectionRef } = useIGRPMenuNavigation();

  function calculeSOATPoderado(): string | undefined {
    if (actividadesEconomicas && actividadesEconomicas.length > 0) {
      const total = actividadesEconomicas.reduce(
        (sum: number, act: any) => sum + (Number.parseFloat(act.taxa) || 0),
        0,
      );
      const weighted = (total / actividadesEconomicas.length).toFixed(2);
      return weighted;
    } else {
      return '0.00';
    }
  }

  function updateActividade(value: string, index: number): void | undefined {
    // Find the selected CAE code
    const selectedCae = tiposActividades.find((cae) => cae.value?.toString() === value.toString());

    // Get current form values
    const currentValues = formform1Ref.current?.getValues();

    // Create the updated atividadesEconomicas array
    const updatedAtividades = [...(currentValues?.actividadesEconomicas || [])];
    if (selectedCae && index !== undefined && index >= 0) {
      updatedAtividades[index] = {
        ...updatedAtividades[index],
        taxa: selectedCae.metadata?.taxa || 0,
      };
    }

    formform1Ref.current?.setValue('actividadesEconomicas', updatedAtividades);

    const weighted = calculeSOATPoderado();

    formform1Ref.current?.setValue('soatUsado', weighted);
  }

  async function handleUploadFile(index: number, e: any): Promise<void | undefined> {
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
      const uploadResponse = await uploadDocument({ file });

      // Update the uploaded file state
      setUploadedFiles((prev: any) => ({
        ...prev,
        [index]: {
          file,
          uploaded: true,
          url: uploadResponse.displayName,
        },
      }));
      // Update the form with the uploaded file URL
      const updatedDocumentos = [...(currentFormData?.anexos || [])];
      updatedDocumentos[index] = {
        ...updatedDocumentos[index],
        url: uploadResponse.displayName,
      };

      setFormContribuinteData((prev: any) => ({
        ...prev,
        ...currentFormData,
        anexos: updatedDocumentos,
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

  async function handleFormSubmit(values: z.infer<any>): Promise<void | undefined> {
    const contribuinte: any = {
      ...values,
      contribuinteId: initialData?.contribuinteId,
    };
    const isValide = validation();
    if (!isValide) return;
    try {
      await createOrUpdateContribuinte(contribuinte);
      igrpToast({
        title: 'Sucesso',
        description: isEdit
          ? 'Contribuinte atualizado com sucesso'
          : 'Contribuinte gravado com sucesso',
        type: 'success',
      });
      router.push('/contribuintes');
    } catch (error: any) {
      igrpToast({
        title: 'Erro',
        description: `Ocorreu um erro ao processar o formulário. [${error.message}]`,
        type: 'error',
      });
      console.log(error);
    }
  }

  async function validation(): Promise<boolean | undefined> {
    const currentValues = formform1Ref.current?.getValues();
    const actividades = currentValues?.actividadesEconomicas || [];
    const contactos = currentValues?.contactos || [];

    const isTaxPayerValid = await validateTaxPayer({
      name: currentValues?.denominacaoSocial || '',
      nif: currentValues?.numDocumentoInscricao || '',
    });
    const isCaeValid = await validateCae({ actividades });
    const isContactValid = await validateContact(contactos);

    if (!isTaxPayerValid || !isCaeValid || !isContactValid) {
      return false;
    }

    return true;
  }

  const router = useRouter();
  const {
    tipoContato,
    tipoEndereco,
    tiposDocumento,
    tiposActividades,
    geografias,
    tiposAnexos,
    tiposEstaduto,
    bancos,
    tiposRespresentacao,
    sedes,
    isLoading,
  } = useNewContribuinteParameterizations();

  const { validateTaxPayer, validateCae, validateContact } = useContribuinteValidation();

  useEffect(() => {
    if (isLoading) return;
    setSelecttipoDocumentoOptions(tiposDocumento || []);
    setSelecttipoEnderecoOptions(tipoEndereco || []);
    setSelecttipoContactoOptions(tipoContato || []);
    setSelectcodigoEstatutoOptions(tiposEstaduto || []);
    setSelectidOperadoraOptions(bancos || []);
    setSelectidTipoDocumentoOptions(tiposAnexos || []);
    setSelectidActividadeEconomicaOptions((tiposActividades || []) as any);
    setSelectidGeografiaOptions(geografias || []);
    setSelecttipoRepresentacaoOptions(tiposRespresentacao || []);
    setSelectuuidSedeOptions(sedes || []);
  }, [isLoading]);

  useEffect(() => {
    if (formform1Ref.current) {
      const subscription = formform1Ref.current.watch((value) => {
        setActividadesEconomicas(value.actividadesEconomicas);
      });

      return () => subscription.unsubscribe();
    }
  }, [formform1Ref.current]);

  useEffect(() => {
    if (actividadesEconomicas) {
      const weighted = calculeSOATPoderado();
      setActividadesEconomicasBadgeValue(`SOAT Ponderado:${weighted}%`);
    }
  }, [actividadesEconomicas]);

  useEffect(() => {
    if (shouldSubmit) {
      formform1Ref.current?.submit();
      onAfterSubmit?.();
    }
  }, [shouldSubmit, onAfterSubmit]);

  useEffect(() => {
    if (initialData) {
      setFormContribuinteData({
        ...initialData,
        dataInicioAtividade: initialData.dataInicioAtividade
          ? new Date(initialData.dataInicioAtividade)
          : undefined,
      });
      setMenuNavigation1BadgeContent(isEdit ? 'Edição' : 'Novo');
    }
  }, [initialData, isEdit]);

  return (
    <div className={cn('component')}>
      <IGRPForm
        schema={formContribuinte}
        validationMode={`onBlur`}
        formRef={formform1Ref}
        className={cn()}
        onSubmit={handleFormSubmit}
        defaultValues={formContribuinteData}
      >
        
          <div className={cn('grid', 'grid-cols-1 ', 'lg:grid-cols-4 ', ' gap-4')}>
            <div className={cn('col-span-1 flex flex-col gap-6 ')}>
              <IGRPMenuNavigation
                title={`Menu`}
                badgeVariant={`solid`}
                badgeColor={`secondary`}
                showChevron={true}
                isStickyTop={true}
                activeSection={menuNavigationmenuNavigation1ActiveSection}
                badgeContent={menuNavigation1BadgeContent}
                className={cn('top-32', '')}
                sections={[
                  {
                    id: 'identificacao',
                    label: `Informações Básicas`,
                    icon: `Building`,
                  },
                  {
                    id: 'actividadesEconomicas',
                    label: `Sector de Actividade/SOAT`,
                    icon: `Briefcase`,
                  },
                  {
                    id: 'enderecos',
                    label: `Endereços`,
                    icon: `MapPin`,
                  },
                  {
                    id: 'contactos',
                    label: `Contacto`,
                    icon: `Phone`,
                  },
                  {
                    id: 'dadosBancarios',
                    label: `Dados Bancários`,
                    icon: `CreditCard`,
                  },
                  {
                    id: 'anexos',
                    label: `Documentos`,
                    icon: `FileText`,
                  },
                  {
                    id: 'obs',
                    label: `Observaçōes`,
                    icon: `MessageSquare`,
                  },
                ]}
              />
              <IGRPAlert
                color={`info`}
                variant={`soft`}
                textColored={true}
                borderColored={true}
                bgColored={true}
                showIcon={true}
                linkIcon={`ArrowRight`}
                className={cn()}
              >
                
                  <IGRPText
                    name={`text3`}
                    variant={`info`}
                    weight={`semibold`}
                    size={`default`}
                    align={`left`}
                    spacing={`normal`}
                    animate={false}
                    truncate={false}
                    maxLines={3}
                    className={cn('mb-0')}
                    highlight={highlighttext3Text}
                  >
                    Dicas
                  </IGRPText>
                  <IGRPText
                    name={`text2`}
                    variant={`info`}
                    weight={`normal`}
                    size={`sm`}
                    align={`left`}
                    spacing={`normal`}
                    animate={false}
                    truncate={false}
                    maxLines={3}
                    className={cn()}
                    highlight={highlighttext2Text}
                  >
                    Preencha todos os campos obrigatórios marcados com * e utilize a navegação
                    lateral para se mover entre as seções.
                  </IGRPText>
                
              </IGRPAlert>
            </div>
            <div className={cn('col-span-3 flex flex-col gap-6 ')}>
              <IGRPCard
                name={`identificacao`}
                ref={getSectionRef('identificacao')}
                data-section-id={'identificacao'}
                className={cn()}
              >
                <IGRPCardHeader className={cn()}>
                  <div
                    className={cn(
                      'flex',
                      'flex flex-row flex-nowrap items-center justify-between gap-2',
                    )}
                  >
                    <IGRPHeadline
                      name={`headline1`}
                      title={`Informações Básicas`}
                      description={`Dados principais do contribuinte`}
                      variant={`h5`}
                      roleColor={`solid`}
                      color={`primary`}
                      showIcon={true}
                      iconName={`Building`}
                      className={cn(
                        'mt-3',
                        'flex flex-row flex-nowrap items-stretch justify-start gap-2',
                        '',
                      )}
                    ></IGRPHeadline>
                    <IGRPBadge
                      name={`badge1`}
                      color={`primary`}
                      variant={`solid`}
                      size={`md`}
                      showIcon={false}
                      iconName={`Info`}
                      iconPlacement={`start`}
                      dot={true}
                      badgeClassName={cn()}
                    >
                      Obrigatório
                    </IGRPBadge>
                  </div>
                </IGRPCardHeader>
                <IGRPCardContent className={cn('', 'space-x-3', 'space-y-3', 'block')}>
                  <div className={cn('grid', 'grid-cols-1 ', 'md:grid-cols-2 ', ' gap-4')}>
                    <IGRPCombobox
                      name={`tipoDocumento`}
                      label={`Tipo de documento de inscrição`}
                      variant={`single`}
                      placeholder={`Select an option...`}
                      required={true}
                      selectLabel={`No option found`}
                      showSearch={true}
                      showIcon={false}
                      iconName={`CornerDownRight`}
                      gridSize={`full`}
                      className={cn('col-span-1')}
                      onChange={() => {}}
                      value={selecttipoDocumentoValue}
                      options={selecttipoDocumentoOptions}
                    ></IGRPCombobox>
                    <IGRPInputText
                      name={`numDocumentoInscricao`}
                      label={`Número de doc. de inscrição`}
                      showIcon={false}
                      required={true}
                      className={cn('col-span-1')}
                    ></IGRPInputText>
                    <IGRPInputText
                      name={`denominacaoSocial`}
                      label={`Denominação Social`}
                      showIcon={false}
                      required={true}
                      className={cn('col-span-1')}
                    ></IGRPInputText>
                    <IGRPInputText
                      name={`nomeComercial`}
                      label={`Nome Comercial`}
                      showIcon={false}
                      required={true}
                      className={cn('col-span-1')}
                    ></IGRPInputText>
                    <IGRPCombobox
                      name={`codigoEstatuto`}
                      label={`Estatuto Juridico`}
                      variant={`single`}
                      placeholder={`Select an option...`}
                      required={true}
                      selectLabel={`No option found`}
                      showSearch={true}
                      gridSize={`full`}
                      className={cn('col-span-1')}
                      onChange={() => {}}
                      value={selectcodigoEstatutoValue}
                      options={selectcodigoEstatutoOptions}
                    ></IGRPCombobox>
                    <IGRPCombobox
                      name={`tipoRepresentacao`}
                      label={`Tipo de representação`}
                      variant={`single`}
                      placeholder={`Select an option...`}
                      required={true}
                      selectLabel={`No option found`}
                      showSearch={true}
                      showIcon={false}
                      iconName={`CornerDownRight`}
                      gridSize={undefined}
                      className={cn('col-span-1')}
                      onChange={(value) => setSelecttipoRepresentacaoValue(value as string)}
                      value={selecttipoRepresentacaoValue}
                      options={selecttipoRepresentacaoOptions}
                    ></IGRPCombobox>
                    <IGRPInputText
                      name={`nomeResponsavel`}
                      label={`Nome do Responsável `}
                      showIcon={false}
                      required={true}
                      className={cn('col-span-1')}
                    ></IGRPInputText>
                    <IGRPDatePicker
                      placeholder={`Please select a date...`}
                      name={`dataInicioAtividade`}
                      id={`dataInicioAtividade`}
                      label={`Data de Início de Atividade`}
                      startDate={new Date(`1900-01-01`)}
                      endDate={new Date(`2099-12-31`)}
                      required={true}
                      gridSize={`full`}
                      dateFormat={`dd/MM/yyyy`}
                      today={new Date(`2025-01-01`)}
                      defaultMonth={new Date(`2025-01-01`)}
                      startMonth={new Date(`2025-01-01`)}
                      month={new Date(`2025-01-01`)}
                      endMonth={new Date(`2025-12-31`)}
                      numberOfMonths={1}
                      captionLayout={`label`}
                      className={cn('col-span-1')}
                    />
                  </div>
                  {selecttipoRepresentacaoValue === 'F' && (
                    <div
                      className={cn(
                        'grid grid grid-cols-3 grid-rows-1 gap-2 justify-items-stretch items-start',
                        ' border rounded-sm p-2',
                      )}
                    >
                      <IGRPText
                        name={`text1`}
                        variant={`primary`}
                        weight={`semibold`}
                        size={`sm`}
                        align={`left`}
                        spacing={`normal`}
                        animate={false}
                        truncate={false}
                        maxLines={3}
                        className={cn()}
                        highlight={highlighttext1Text}
                      >
                        Informações da SEDE
                      </IGRPText>
                      <IGRPCombobox
                        name={`uuidSede`}
                        label={`Contribuinte SEDE`}
                        variant={`single`}
                        placeholder={`Select an option...`}
                        required={true}
                        selectLabel={`No option found`}
                        showSearch={true}
                        showIcon={false}
                        iconName={`CornerDownRight`}
                        gridSize={`full`}
                        className={cn()}
                        onChange={() => {}}
                        value={selectuuidSedeValue}
                        options={selectuuidSedeOptions}
                      ></IGRPCombobox>
                    </div>
                  )}
                  <IGRPInputHidden
                    name={`soatUsado`}
                    label={`soatUsado`}
                    required={false}
                    className={cn('')}
                  ></IGRPInputHidden>
                </IGRPCardContent>
                <IGRPCardFooter className={cn()}></IGRPCardFooter>
              </IGRPCard>
              <IGRPFormList
                ref={getSectionRef('actividadesEconomicas')}
                data-section-id={'actividadesEconomicas'}
                id={`formlist_4ayxgn`}
                name={`actividadesEconomicas`}
                label={`Sector de Actividade/SOAT`}
                description={`Atividades econômicas do contribuinte`}
                color={`primary`}
                variant={`solid`}
                addButtonLabel={`Add`}
                iconName={`Briefcase`}
                addButtonIconName={`Plus`}
                renderItem={(_: any, index: number) => (
                  <>
                    <div
                      className={cn(
                        'grid',
                        'grid-cols-1 ',
                        'md:grid-cols-2 ',
                        'lg:grid-cols-3 ',
                        ' gap-4 mb-3',
                      )}
                    >
                      <IGRPCombobox
                        name={`actividadesEconomicas.${index}.idActividadeEconomica`}
                        label={`Actividade`}
                        variant={`single`}
                        placeholder={`Select an option...`}
                        required={true}
                        selectLabel={`No option found`}
                        showSearch={true}
                        showIcon={false}
                        iconName={`CornerDownRight`}
                        className={cn('col-span-1')}
                        onChange={(value) => {
                          updateActividade(value as string, index);
                        }}
                        value={selectidActividadeEconomicaValue}
                        options={selectidActividadeEconomicaOptions}
                      ></IGRPCombobox>
                      <IGRPInputNumber
                        name={`actividadesEconomicas.${index}.taxa`}
                        label={`SOAT`}
                        max={9999999}
                        step={1}
                        required={true}
                        disabled={true}
                        className={cn('col-span-1')}
                      ></IGRPInputNumber>
                    </div>
                    <IGRPCheckbox
                      name={`actividadesEconomicas.${index}.principal`}
                      label={`Principal`}
                      className={cn()}
                    ></IGRPCheckbox>
                    <IGRPInputHidden
                      name={`actividadesEconomicas.${index}.inputHidden2`}
                      label={`Sector Id`}
                      required={false}
                      className={cn()}
                    ></IGRPInputHidden>
                  </>
                )}
                computeLabel={(item: any, index: number) => `Item ${index}`}
                className={cn('', 'block')}
                defaultItem={formListactividadesEconomicasDefault}
                badgeValue={actividadesEconomicasBadgeValue}
              ></IGRPFormList>

              <IGRPFormList
                ref={getSectionRef('enderecos')}
                data-section-id={'enderecos'}
                id={`formlist_x67fp6`}
                name={`enderecos`}
                label={`Endereços`}
                description={`Endereços do contribuinte`}
                color={`primary`}
                variant={`solid`}
                addButtonLabel={`Add`}
                iconName={`MapPin`}
                addButtonIconName={`Plus`}
                renderItem={(_: any, index: number) => (
                  
                    <div
                      className={cn(
                        'grid',
                        'grid-cols-1 ',
                        'md:grid-cols-2 ',
                        'lg:grid-cols-4 ',
                        ' gap-4',
                      )}
                    >
                      <IGRPCombobox
                        name={`enderecos.${index}.tipoEndereco`}
                        label={`Tipo de Endereço`}
                        variant={`single`}
                        placeholder={`Select an option...`}
                        required={true}
                        selectLabel={`No option found`}
                        showSearch={true}
                        showIcon={false}
                        iconName={`CornerDownRight`}
                        gridSize={undefined}
                        className={cn('col-span-1')}
                        onChange={() => {}}
                        value={selecttipoEnderecoValue}
                        options={selecttipoEnderecoOptions}
                      ></IGRPCombobox>
                      <IGRPInputText
                        name={`enderecos.${index}.rua`}
                        label={`Endereço`}
                        showIcon={false}
                        required={true}
                        className={cn('col-span-1')}
                      ></IGRPInputText>
                      <IGRPInputText
                        name={`enderecos.${index}.pontoRef`}
                        label={`Ponto Referência  `}
                        showIcon={false}
                        required={true}
                        className={cn('col-span-1')}
                      ></IGRPInputText>
                      <IGRPCombobox
                        name={`enderecos.${index}.idGeografia`}
                        label={`Região`}
                        variant={`single`}
                        placeholder={`Select an option...`}
                        required={true}
                        selectLabel={`No option found`}
                        showSearch={true}
                        showIcon={false}
                        iconName={`CornerDownRight`}
                        gridSize={undefined}
                        className={cn('col-span-1')}
                        onChange={() => {}}
                        value={selectidGeografiaValue}
                        options={selectidGeografiaOptions}
                      ></IGRPCombobox>
                      <IGRPInputText
                        name={`enderecos.${index}.caixaPostal`}
                        label={`Caixa Postal`}
                        showIcon={false}
                        required={false}
                        className={cn('col-span-1')}
                      ></IGRPInputText>
                      <IGRPInputText
                        name={`enderecos.${index}.numPorta`}
                        label={`Numero de Porta`}
                        showIcon={false}
                        required={false}
                        className={cn('col-span-1')}
                      ></IGRPInputText>
                      <IGRPInputHidden
                        name={`enderecos.${index}.inputHidden1`}
                        label={`Endereco Id`}
                        required={false}
                        className={cn('col-span-1')}
                      ></IGRPInputHidden>
                    </div>
                  
                )}
                computeLabel={(item: any, index: number) => `Item ${index}`}
                className={cn()}
                defaultItem={formListenderecosDefault}
              ></IGRPFormList>

              <IGRPFormList
                ref={getSectionRef('contactos')}
                data-section-id={'contactos'}
                id={`formlist_j5e1ei`}
                name={`contactos`}
                label={`Contactos`}
                color={`primary`}
                variant={`solid`}
                addButtonLabel={`Add`}
                iconName={`Phone`}
                renderItem={(_: any, index: number) => (
                  
                    <div
                      className={cn(
                        'grid',
                        'grid-cols-2',
                        'grid grid grid-cols-2 grid-rows-1 gap-2 justify-items-stretch items-start',
                        ' gap-4',
                      )}
                    >
                      <IGRPCombobox
                        name={`contactos.${index}.tipoContacto`}
                        label={`Tipo de Contato`}
                        variant={`single`}
                        placeholder={`Select an option...`}
                        required={true}
                        selectLabel={`No option found`}
                        showSearch={true}
                        showIcon={false}
                        iconName={`CornerDownRight`}
                        gridSize={undefined}
                        className={cn('col-span-1')}
                        onChange={() => {}}
                        value={selecttipoContactoValue}
                        options={selecttipoContactoOptions}
                      ></IGRPCombobox>
                      <IGRPInputText
                        name={`contactos.${index}.contacto`}
                        label={`Contacto`}
                        showIcon={false}
                        required={false}
                        className={cn('col-span-1')}
                      ></IGRPInputText>
                      <IGRPInputHidden
                        name={`contactos.${index}.inputHidden3`}
                        label={`Contacto Id`}
                        required={false}
                        className={cn('col-span-1')}
                      ></IGRPInputHidden>
                    </div>
                  
                )}
                computeLabel={(item: any, index: number) => `Item ${index}`}
                className={cn('md:grid-cols-2', 'block')}
                defaultItem={formListformList1Default}
              ></IGRPFormList>

              <IGRPFormList
                ref={getSectionRef('dadosBancarios')}
                data-section-id={'dadosBancarios'}
                id={`formlist_3flio8`}
                name={`dadosBancarios`}
                label={`Dados Bancários`}
                description={`Informações bancárias do contribuinte`}
                color={`primary`}
                variant={`solid`}
                addButtonLabel={`Add`}
                iconName={`CreditCard`}
                addButtonIconName={`Plus`}
                renderItem={(_: any, index: number) => (
                  
                    <div
                      className={cn(
                        'grid',
                        'grid-cols-1 ',
                        'md:grid-cols-2 ',
                        'lg:grid-cols-3 ',
                        ' gap-4',
                      )}
                    >
                      <IGRPCombobox
                        name={`dadosBancarios.${index}.idOperadora`}
                        label={`Banco`}
                        variant={`single`}
                        placeholder={`Select an option...`}
                        required={true}
                        selectLabel={`No option found`}
                        showSearch={true}
                        showIcon={false}
                        iconName={`CornerDownRight`}
                        gridSize={`full`}
                        className={cn('col-span-1')}
                        onChange={() => {}}
                        value={selectidOperadoraValue}
                        options={selectidOperadoraOptions}
                      ></IGRPCombobox>
                      <IGRPInputText
                        name={`dadosBancarios.${index}.nib`}
                        label={`NIB`}
                        showIcon={false}
                        required={true}
                        className={cn('col-span-1')}
                      ></IGRPInputText>
                      <IGRPInputText
                        name={`dadosBancarios.${index}.numConta`}
                        label={`N Conta`}
                        showIcon={false}
                        required={true}
                        className={cn('col-span-1')}
                      ></IGRPInputText>
                      <IGRPInputHidden
                        name={`dadosBancarios.${index}.inputHidden4`}
                        label={`Bancario id`}
                        required={false}
                        className={cn('col-span-1')}
                      ></IGRPInputHidden>
                    </div>
                  
                )}
                computeLabel={(item: any, index: number) => `Item ${index}`}
                className={cn()}
                defaultItem={formListdadosBancariosDefault}
              ></IGRPFormList>

              <IGRPFormList
                ref={getSectionRef('anexos')}
                data-section-id={'anexos'}
                id={`formlist_i0c7bj`}
                name={`anexos`}
                label={`Documentos`}
                description={`Documentos do contribuinte`}
                color={`primary`}
                variant={`solid`}
                addButtonLabel={`Add`}
                iconName={`FileText`}
                addButtonIconName={`Plus`}
                renderItem={(_: any, index: number) => (
                  
                    <div
                      className={cn(
                        'grid',
                        'grid-cols-1 ',
                        'md:grid-cols-2 ',
                        'lg:grid-cols-3 ',
                        ' gap-4',
                      )}
                    >
                      <IGRPCombobox
                        name={`anexos.${index}.idTipoDocumento`}
                        label={`Tipo de Documento`}
                        variant={`single`}
                        placeholder={`Select an option...`}
                        selectLabel={`No option found`}
                        showSearch={true}
                        showIcon={false}
                        iconName={`CornerDownRight`}
                        gridSize={`full`}
                        className={cn('col-span-1')}
                        onChange={() => {}}
                        value={selectidTipoDocumentoValue}
                        options={selectidTipoDocumentoOptions}
                      ></IGRPCombobox>
                      <IGRPInputFile
                        name={`anexos.${index}.inputFile1`}
                        label={`Input File`}
                        accept={`application/pdf`}
                        required={false}
                        className={cn('col-span-1')}
                        onChange={(e) => handleUploadFile(index, e)}
                      ></IGRPInputFile>
                      <UploadState
                        isUploading={isUploading}
                        uploadedFiles={uploadedFiles}
                        index={index}
                      ></UploadState>
                      <IGRPInputHidden
                        name={`anexos.${index}.url`}
                        label={`url`}
                        required={false}
                        className={cn('col-span-1')}
                      ></IGRPInputHidden>
                      <IGRPInputHidden
                        name={`anexos.${index}.inputHidden5`}
                        label={`Doc Id`}
                        required={false}
                        className={cn('col-span-1')}
                      ></IGRPInputHidden>
                    </div>
                  
                )}
                computeLabel={(item: any, index: number) => `Item ${index}`}
                className={cn()}
                defaultItem={formListanexosDefault}
              ></IGRPFormList>

              <div className={cn()}>
                <IGRPTextarea
                  name={`observacao`}
                  label={`Observaçōes`}
                  rows={3}
                  required={true}
                  placeholder={`Digite aqui quaisquer observações relevantes sobre o contribuinte...`}
                  className={cn()}
                ></IGRPTextarea>
              </div>
            </div>
          </div>
        
      </IGRPForm>
    </div>
  );
}
