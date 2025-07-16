'use client';

/* THIS FILE WAS GENERATED AUTOMATICALLY BY iGRP STUDIO. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useRef } from 'react';
import { cn, useIGRPMenuNavigation, useIGRPToast } from '@igrp/igrp-framework-react-design-system';
import { IGRPFormHandle } from '@igrp/igrp-framework-react-design-system';
import { z } from '@igrp/igrp-framework-react-design-system';
import { IGRPOptionsProps } from '@igrp/igrp-framework-react-design-system';
import {
  IGRPMenuNavigation,
  IGRPForm,
  IGRPCard,
  IGRPCardHeader,
  IGRPIcon,
  IGRPHeadline,
  IGRPBadge,
  IGRPCardContent,
  IGRPCombobox,
  IGRPInputNumber,
  IGRPSelect,
  IGRPInputFile,
  IGRPTextarea,
  IGRPButton,
} from '@igrp/igrp-framework-react-design-system';
import { DeclaracaoStatus } from '@/app/(myapp)/types/declaracao';
import { Anexo } from '@/app/(myapp)/types/declaracao';
import { Declaracao } from '@/app/(myapp)/types/declaracao';
import { createOrUpdateDeclaracao } from '@/app/(myapp)/hooks/use-declaracao';
import { useRouter } from 'next/navigation';
import { getContribuintes } from '@/app/(myapp)/actions/mock-actions';
import { getMesesReferencia } from '@/app/(myapp)/actions/mock-actions';
import { useNewDeclaracaoParameterizations } from '@/app/(myapp)/hooks/use-parametrization';

export default function Declaracaoform({
  isEdit,
  initialData,
  shouldSubmit,
  onAfterSubmit,
  isSubmitting,
  setIsSubmitting,
}: {
  isEdit?: boolean;
  initialData?: any;
  shouldSubmit: boolean;
  onAfterSubmit: () => void;
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
}) {
  const declaracaoStatus = z.enum([
    'POR_ENTREGAR',
    'SUBMETIDA',
    'VERIFICADA',
    'PROCESSADA',
    'VALIDADA',
  ]);

  const anexo = z.object({
    nomeFicheiro: z.string(),
    idTipoDocumento: z.number(),
    url: z.string(),
  });

  type AnexoZodType = typeof anexo;

  const initAnexo: z.infer<AnexoZodType> = {
    nomeFicheiro: ``,
    idTipoDocumento: 0,
    url: ``,
  };

  const declaracao = z.object({
    declaracaoId: z.string(),
    processoId: z.string(),
    contribuinteId: z.string(),
    nomeContribuinte: z.string(),
    numeroContribuinte: z.string(),
    data: z.string(),
    mesReferencia: z.string(),
    salario: z.number(),
    diasTrabalho: z.number(),
    outrasRemuneracoes: z.number(),
    valorSoat: z.number(),
    totalComparticipacao: z.number(),
    compRegimeGeral: z.number(),
    compSoat: z.number(),
    estadoDeclaracao: declaracaoStatus,
    estadoDeclaracaoDesc: z.string(),
    observacao: z.string().optional(),
    anexos: z.array(anexo).optional(),
  });

  type DeclaracaoZodType = typeof declaracao;

  const initDeclaracao: z.infer<DeclaracaoZodType> = {
    declaracaoId: ``,
    processoId: ``,
    contribuinteId: ``,
    nomeContribuinte: ``,
    numeroContribuinte: ``,
    data: ``,
    mesReferencia: ``,
    salario: 0,
    diasTrabalho: 0,
    outrasRemuneracoes: 0,
    valorSoat: 0,
    totalComparticipacao: 0,
    compRegimeGeral: 0,
    compSoat: 0,
    estadoDeclaracao: 'POR_ENTREGAR',
    estadoDeclaracaoDesc: ``,
    observacao: ``,
    anexos: undefined,
  };

  const formform_declarationsRef = useRef<IGRPFormHandle<DeclaracaoZodType> | null>(null);
  const [
    menuNavigationform_navigation_menuBadgeContent,
    setMenuNavigationform_navigation_menuBadgeContent,
  ] = useState<string>(``);
  const [
    menuNavigationform_navigation_menuActiveSection,
    setMenuNavigationform_navigation_menuActiveSection,
  ] = useState<string>(``);
  const [contentFormform_declarations, setContentFormform_declarations] =
    useState<z.infer<DeclaracaoZodType>>(initDeclaracao);
  const [comboboxContribuinteIdOptions, setComboboxContribuinteIdOptions] = useState<
    IGRPOptionsProps[]
  >([]);
  const [selectMesReferenciaOptions, setSelectMesReferenciaOptions] = useState<IGRPOptionsProps[]>(
    [],
  );

  const { igrpToast } = useIGRPToast();

  const { getSectionRef } = useIGRPMenuNavigation();

  function calculeTotalComparticipacao(): number | undefined {
    return 0;
  }

  function calculeComparticipacaoRegimeGeral(): number | undefined {
    return 0;
  }

  function calculeComparticipacaoSoat(): number | undefined {
    return 0;
  }

  async function onSubmit(values: z.infer<any>): Promise<void> {
    const declaracao: any = {
      ...values,
      declaracaoId: initialData?.declaracaoId,
    };

    setIsSubmitting(true);

    try {
      await createOrUpdateDeclaracao(declaracao);
      igrpToast({
        title: isEdit ? 'Declaração atualizada' : 'Declaração adicionada',
        description: `${values.contribuinteId} foi ${isEdit ? 'atualizada' : 'adicionada'} com sucesso.`,
      });
      router.push('/declaracoes');
    } catch (error) {
      igrpToast({
        title: 'Erro',
        description: 'Ocorreu um erro ao processar o formulário.',
        type: 'error',
      });
      console.log(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  function onCancel(): void { }

  const router = useRouter();

  const { isLoading } = useNewDeclaracaoParameterizations();

  useEffect(() => {
    if (isLoading) return;
    loadFormFields();
  }, [isLoading]);

  useEffect(() => {
    if (shouldSubmit) {
      formform_declarationsRef.current?.submit();
      onAfterSubmit?.();
    }
  }, [shouldSubmit, onAfterSubmit]);

  useEffect(() => {
    if (initialData) {
      setContentFormform_declarations(initialData);
    }
    setMenuNavigationform_navigation_menuBadgeContent(isEdit ? 'Edição' : 'Novo');
  }, [initialData, isEdit]);

  const loadFormFields = async () => {
    setComboboxContribuinteIdOptions(await getContribuintes());
    setSelectMesReferenciaOptions(await getMesesReferencia());
  };

  return (
    <div className={cn('component')}>
      <div
        className={cn(
          'inline-grid grid grid-cols-6 grid-rows-1 gap-4 justify-items-stretch items-start',
          'pr-4 pb-6 pl-4 px-4',
        )}
      >
        <div className={cn('grid', 'grid-rows-1', ' gap-2')}>
          <div className={cn(' col-span-1')}>
            <IGRPMenuNavigation
              title={`Navegação`}
              badgeVariant={`outline`}
              isStickyTop={true}
              onSectionChange={setMenuNavigationform_navigation_menuActiveSection}
              badgeContent={menuNavigationform_navigation_menuBadgeContent}
              activeSection={menuNavigationform_navigation_menuActiveSection}
              className={cn('top-32')}
              sections={[
                {
                  id: 'basic_information_card',
                  label: `Informações Básicas`,
                  icon: `Building`,
                },
                {
                  id: 'attachments_card',
                  label: `Anexos`,
                  icon: `Paperclip`,
                },
                {
                  id: 'observations_card',
                  label: `Observações`,
                  icon: `MessageSquare`,
                },
              ]}
            />
          </div>
        </div>
        <div className={cn(' col-span-5')}>
          <div className={cn(' relative')}>
            <IGRPForm
              schema={declaracao}
              formRef={formform_declarationsRef}
              className={cn('space-y-6')}
              onSubmit={async (values) => await onSubmit(values)}
              defaultValues={contentFormform_declarations}
            >
              <>
                <IGRPCard
                  name={`basic_information_card`}
                  ref={getSectionRef('basic_information_card')}
                  data-section-id={'basic_information_card'}
                  className={cn('shadow-sm')}
                >
                  <IGRPCardHeader
                    className={cn('border-b flex flex-row items-center justify-between')}
                  >
                    <div className={cn('flex', 'flex-row', ' justify-between')}>
                      <div className={cn(' py-3')}>
                        <IGRPIcon
                          name={`basic_information_building_icon`}
                          iconName={`Building`}
                          className={cn('h-6 w-6 text-muted-foreground')}
                        ></IGRPIcon>
                      </div>
                      <div className={cn(' px-5')}>
                        <IGRPHeadline
                          name={`basic_information_headline`}
                          variant={`h6`}
                          title={`Informações Básicas`}
                          description={`Dados principais da declaração`}
                        ></IGRPHeadline>
                      </div>
                    </div>
                    <IGRPBadge
                      name={`basic_information_badge`}
                      variant={`outline`}
                      color={`destructive`}
                      badgeClassName={cn('font-normal text-xs text-red-800')}
                    >
                      Obrigatório (*)
                    </IGRPBadge>
                  </IGRPCardHeader>
                  <IGRPCardContent className={cn('p-4')}>
                    <div
                      className={cn(
                        'grid',
                        'grid-cols-4 ',
                        'md:grid-cols-3 ',
                        'lg:grid-cols-4 ',
                        ' gap-4',
                      )}
                    >
                      <IGRPCombobox
                        name={`contribuinteId`}
                        label={`Nº de Contribuinte`}
                        placeholder={`Escolha o contribuinte`}
                        required={true}
                        showSearch={true}
                        className={cn('col-span-1')}
                        options={comboboxContribuinteIdOptions}
                      ></IGRPCombobox>
                      <IGRPInputNumber
                        name={`valorSoat`}
                        label={`Valor SOAT`}
                        min={0}
                        required={false}
                        className={cn('col-span-1')}
                      ></IGRPInputNumber>
                      <IGRPSelect
                        name={`mesReferencia`}
                        label={`Mês de Referência`}
                        placeholder={`Escolha o mês de referência`}
                        required={true}
                        showSearch={true}
                        className={cn('col-span-1')}
                        options={selectMesReferenciaOptions}
                      ></IGRPSelect>
                      <IGRPInputNumber
                        name={`diasTrabalho`}
                        label={`Dias de Trabalho`}
                        min={0}
                        required={true}
                        className={cn('col-span-1')}
                      ></IGRPInputNumber>
                      <IGRPInputNumber
                        name={`salario`}
                        label={`Salário`}
                        min={0}
                        required={true}
                        className={cn('col-span-1')}
                      ></IGRPInputNumber>
                      <IGRPInputNumber
                        name={`outrasRemuneracoes`}
                        label={`Outras Remunerações`}
                        min={0}
                        required={false}
                        className={cn('col-span-1')}
                      ></IGRPInputNumber>
                      <IGRPInputNumber
                        name={`compRegimeGeral`}
                        label={`Comparticipação Regime Geral`}
                        min={0}
                        required={false}
                        className={cn('col-span-1')}
                      ></IGRPInputNumber>
                      <IGRPInputNumber
                        name={`compSoat`}
                        label={`Comparticipação SOAT`}
                        min={0}
                        required={false}
                        className={cn('col-span-1')}
                      ></IGRPInputNumber>
                      <IGRPInputNumber
                        name={`totalComparticipacao`}
                        label={`Total Comparticipação`}
                        min={0}
                        required={false}
                        className={cn('col-span-1')}
                      ></IGRPInputNumber>
                    </div>
                  </IGRPCardContent>
                </IGRPCard>
                <IGRPCard
                  name={`attachments_card`}
                  ref={getSectionRef('attachments_card')}
                  data-section-id={'attachments_card'}
                  className={cn('shadow-sm')}
                >
                  <IGRPCardHeader
                    className={cn('border-b flex flex-row items-center justify-between')}
                  >
                    <div className={cn('flex', 'flex-row', ' justify-between')}>
                      <div className={cn(' py-3')}>
                        <IGRPIcon
                          name={`attachments_message_square_icon`}
                          iconName={`Paperclip`}
                          className={cn('h-6 w-6 text-muted-foreground')}
                        ></IGRPIcon>
                      </div>
                      <div className={cn(' px-5')}>
                        <IGRPHeadline
                          name={`attachments_headline`}
                          variant={`h6`}
                          title={`Anexos`}
                          description={`Anexe ficheiros relacionados à declaração`}
                        ></IGRPHeadline>
                      </div>
                    </div>
                    <IGRPBadge
                      name={`attachments_badge`}
                      variant={`outline`}
                      color={`destructive`}
                      badgeClassName={cn('font-normal text-xs text-red-800')}
                    >
                      Obrigatório (*)
                    </IGRPBadge>
                  </IGRPCardHeader>
                  <IGRPCardContent className={cn('p-4')}>
                    <div
                      className={cn(
                        'grid',
                        'grid-cols-2 ',
                        'md:grid-cols-2 ',
                        'lg:grid-cols-2 ',
                        ' gap-4',
                      )}
                    >
                      <IGRPInputFile
                        name={`fosFile`}
                        label={`FOS - Folha de Ordenado e Salário`}
                        placeholder={`Carregue o ficheiro...`}
                        accept={`application/pdf`}
                        required={true}
                        className={cn('col-span-1')}
                      ></IGRPInputFile>
                      <IGRPInputFile
                        name={`compPagamentoFile`}
                        label={`CP - Comprovativo de Pagamento`}
                        placeholder={`Carregue o ficheiro...`}
                        accept={`application/pdf`}
                        required={false}
                        className={cn('col-span-1')}
                      ></IGRPInputFile>
                      <IGRPInputFile
                        name={`otherFiles`}
                        label={`Outros`}
                        placeholder={`Carregue outros ficheiros...`}
                        multiple={true}
                        accept={`.pdf, application/pdf, .xls, .xlsx, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, image/*`}
                        required={false}
                        className={cn('col-span-1')}
                      ></IGRPInputFile>
                    </div>
                  </IGRPCardContent>
                </IGRPCard>
                <IGRPCard
                  name={`observations_card`}
                  ref={getSectionRef('observations_card')}
                  data-section-id={'observations_card'}
                  className={cn('shadow-sm')}
                >
                  <IGRPCardHeader
                    className={cn('border-b flex flex-row items-center justify-between')}
                  >
                    <div className={cn('flex', 'flex-row', ' justify-between')}>
                      <div className={cn(' py-3')}>
                        <IGRPIcon
                          name={`observations_message_square_icon`}
                          iconName={`MessageSquare`}
                          className={cn('h-6 w-6 text-muted-foreground')}
                        ></IGRPIcon>
                      </div>
                      <div className={cn(' px-5')}>
                        <IGRPHeadline
                          name={`observations_headline`}
                          variant={`h6`}
                          title={`Observações`}
                          description={`Notas adicionais sobre a declaração`}
                        ></IGRPHeadline>
                      </div>
                    </div>
                    <IGRPBadge
                      name={`observations_badge`}
                      variant={`outline`}
                      color={`secondary`}
                      badgeClassName={cn('font-normal text-xs')}
                    >
                      Opcional
                    </IGRPBadge>
                  </IGRPCardHeader>
                  <IGRPCardContent className={cn('p-4')}>
                    <div className={cn('grid', 'grid-cols-1', ' gap-4')}>
                      <IGRPTextarea
                        name={`observacoes`}
                        label={`Observações`}
                        helperText={`Digite aqui quaisquer observações relevantes sobre a declaração...`}
                        rows={6}
                        className={cn('col-span-1')}
                      ></IGRPTextarea>
                    </div>
                  </IGRPCardContent>
                </IGRPCard>
              </>
            </IGRPForm>
            <div
              className={cn(
                ' sticky bottom-0 left-0 right-0 mt-6 bg-background border-t shadow-md py-2 px-4 z-10',
              )}
            >
              <div className={cn('flex', 'justify-between', ' items-center w-full')}>
                <div className={cn('flex flex-row flex-nowrap items-center justify-start gap-2')}>
                  <>
                    {isEdit && (
                      <IGRPBadge
                        name={`edit_declaration_badge`}
                        variant={`outline`}
                        showIcon={true}
                        iconName={`CircleCheck`}
                        badgeClassName={cn('bg-blue-50 text-blue-700 border-blue-200')}
                      >
                        Editando Declaração
                      </IGRPBadge>
                    )}
                    {!isEdit && (
                      <IGRPBadge
                        name={`new_declaration_badge`}
                        variant={`outline`}
                        showIcon={true}
                        iconName={`Plus`}
                        badgeClassName={cn('bg-blue-50 text-blue-700 border-blue-200')}
                      >
                        Nova Declaração
                      </IGRPBadge>
                    )}
                  </>
                  <p className={cn(' text-xs text-muted-foreground')}>
                    Preencha os campos obrigatórios marcados com *
                  </p>
                </div>
                <div className={cn('flex', ' gap-3')}>
                  {onCancel && (
                    <IGRPButton
                      name={`footer_cancel_button`}
                      variant={`outline`}
                      onClick={onCancel}
                    >
                      Cancelar
                    </IGRPButton>
                  )}
                  <IGRPButton
                    name={`button_form_tax_payer_submit`}
                    type={`submit`}
                    className={cn('min-w-[150px]')}
                    onClick={() => formform_declarationsRef.current?.submit()}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <p className={cn(' animate-pulse')}>Processando...</p>}
                    {isEdit && !isSubmitting && <p className={cn()}>Salvar Alterações</p>}
                    {!isEdit && !isSubmitting && <p className={cn()}>Salvar Declaração</p>}
                  </IGRPButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
