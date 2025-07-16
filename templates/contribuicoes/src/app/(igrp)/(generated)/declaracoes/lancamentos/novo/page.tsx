'use client';

/* THIS FILE WAS GENERATED AUTOMATICALLY BY iGRP STUDIO. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useRef } from 'react';
import { cn, useIGRPMenuNavigation, useIGRPToast } from '@igrp/igrp-framework-react-design-system';
import { IGRPFormHandle } from '@igrp/igrp-framework-react-design-system';
import { z } from '@igrp/igrp-framework-react-design-system';
import {
  IGRPPageHeader,
  IGRPButton,
  IGRPStatusBanner,
  IGRPCard,
  IGRPCardHeader,
  IGRPIcon,
  IGRPHeadline,
  IGRPCardContent,
  IGRPPdfViewer,
  IGRPBadge,
  IGRPForm,
  IGRPFormList,
  IGRPInputText,
  IGRPDatePicker,
  IGRPInputNumber,
} from '@igrp/igrp-framework-react-design-system';
import { InfoDesconto } from '@/app/(myapp)/data/types';
import { Launch } from '@/app/(myapp)/data/types';
import { NewLaunchRequest } from '@/app/(myapp)/data/types';
import { Contribuinte } from '@/app/(myapp)/data/types';
import { getContribuintes } from '@/app/(myapp)/actions/mock-actions';
import { getMesesReferencia } from '@/app/(myapp)/actions/mock-actions';
import { onSubmitLaunchForm } from '@/app/(myapp)/actions/mock-actions';
import { getInfoDesconto } from '@/app/(myapp)/actions/mock-actions';
import { useFieldArray } from 'react-hook-form';
import { useRouter } from 'next/navigation';

export default function PageNovolancamentoComponent() {
  const launch = z.object({
    numeroBeneficiario: z.string(),
    nomeBeneficiario: z.string(),
    dataNascimento: z.string(),
    diasTrabalho: z.number(),
    salarioDiario: z.number(),
    outrasRemuneracoes: z.number(),
    totalMensal: z.number(),
    compSoat: z.number(),
    compRegimeGeral: z.number(),
    observacao: z.string().optional(),
  });

  type LaunchZodType = typeof launch;

  const initLaunch: z.infer<LaunchZodType> = {
    numeroBeneficiario: ``,
    nomeBeneficiario: ``,
    dataNascimento: ``,
    diasTrabalho: 0,
    salarioDiario: 0,
    outrasRemuneracoes: 0,
    totalMensal: 0,
    compSoat: 0,
    compRegimeGeral: 0,
    observacao: `0`,
  };
  const newLaunchRequest = z.object({
    lancamento: z.array(launch),
  });

  type NewLaunchRequestZodType = typeof newLaunchRequest;

  const initNewLaunchRequest: z.infer<NewLaunchRequestZodType> = {
    lancamento: [],
  };

  const [contentFormform_launch, setContentFormform_launch] =
    useState<z.infer<NewLaunchRequestZodType>>(initNewLaunchRequest);
  const [formListlancamentoDefault, setFormListlancamentoDefault] = useState<Launch>(initLaunch);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const formform_launchRef = useRef<IGRPFormHandle<NewLaunchRequestZodType> | null>(null);

  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const [isEdit, setIsEdit] = useState<boolean>(false);

  const [infoDesconto, setInfoDesconto] = useState<InfoDesconto | undefined>(undefined);

  const router = useRouter();

  async function onSubmit(values: NewLaunchRequest): Promise<void> {
    setIsSubmitting(true);

    try {
      await onSubmitLaunchForm(values);
      igrpToast({
        title: isEdit ? 'Declaração atualizada' : 'Declaração adicionada',
        description: `O lançamento foi ${isEdit ? 'atualizado' : 'submetido'} com sucesso.`,
      });
    } catch (error) {
      igrpToast({
        title: 'Erro',
        description: 'Ocorreu um erro ao processar o formulário.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function onCancel(): void {}

  const { igrpToast } = useIGRPToast();

  useEffect(() => {
    loadFormFields();
  }, []);

  const loadFormFields = async () => {
    setInfoDesconto(await getInfoDesconto());
    setFormListlancamentoDefault({
      numeroBeneficiario: '',
      nomeBeneficiario: '',
      dataNascimento: '',
      diasTrabalho: 0,
      salarioDiario: 0,
      outrasRemuneracoes: 0,
      totalMensal: 0,
      compSoat: 0,
      compRegimeGeral: 0,
      observacao: '0',
    });
  };

  function handlebutton_cancelarNavigation(row?: any): void {
    router.push(`/declaracoes`);
  }

  return (
    <div className={cn('page')}>
      <div className={cn('flex', 'flex-col', ' min-h-full')}>
        <IGRPPageHeader
          title={`Novo Lançamento`}
          isSticky={true}
          showBackButton={true}
          urlBackButton={`/declaracoes`}
          variant={`h3`}
          className={cn('', 'flex flex-row flex-nowrap items-center justify-between gap-2', 'mb-4')}
        >
          <div className="flex items-center gap-2">
            <IGRPButton
              name={`button_cancelar`}
              size={`sm`}
              variant={`outline`}
              onClick={() => handlebutton_cancelarNavigation()}
            >
              Cancelar
            </IGRPButton>
            <IGRPButton
              name={`button_save`}
              size={`sm`}
              onClick={() => formform_launchRef.current?.submit()}
            >
              Salvar Lançamento
            </IGRPButton>
          </div>
        </IGRPPageHeader>

        <div
          className={cn(
            'flex flex-col flex-nowrap items-stretch justify-start gap-2',
            'pr-4 pb-6 pl-4 px-4',
            ' space-y-8',
          )}
        >
          <IGRPStatusBanner
            name={`info_valor_desconto_banner`}
            color={`secondary`}
            variant={`soft`}
            text={`Comparticipação Regime Geral: ${infoDesconto?.regimeGeral}%`}
            badgeText={`Comparticipação SOAT: ${infoDesconto?.soat}%`}
            badgeVariant={`outline`}
          ></IGRPStatusBanner>
          <IGRPCard name={`attachments_card`} className={cn('shadow-sm')}>
            <IGRPCardHeader className={cn('border-b flex flex-row items-center justify-between')}>
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
                    title={`Documento Anexado`}
                    description={`Documento anexado na criação da declaração`}
                  ></IGRPHeadline>
                </div>
              </div>
            </IGRPCardHeader>
            <IGRPCardContent className={cn('p-4')}>
              <IGRPPdfViewer
                document={{
                  id: 1,
                  title: 'FOS',
                  description: 'Declaração anexada',
                  author: '',
                  date: '2025-02-01',
                  fileUrl:
                    'https://assets.accessible-digital-documents.com/uploads/2017/01/sample-tables.pdf',
                }}
                displayMode={`inline`}
              ></IGRPPdfViewer>
            </IGRPCardContent>
          </IGRPCard>
          <IGRPCard name={`launch_card`} className={cn('shadow-sm')}>
            <IGRPCardHeader className={cn('border-b flex flex-row items-center justify-between')}>
              <div className={cn('flex', 'flex-row', ' justify-between')}>
                <div className={cn(' py-3')}>
                  <IGRPIcon
                    name={`launch_message_square_icon`}
                    iconName={`ExternalLink`}
                    className={cn('h-6 w-6 text-muted-foreground')}
                  ></IGRPIcon>
                </div>
                <div className={cn(' px-5')}>
                  <IGRPHeadline
                    name={`launch_headline`}
                    variant={`h6`}
                    title={`Lançamento`}
                    description={`Lançamento de dados para a declaração`}
                  ></IGRPHeadline>
                </div>
              </div>
              <IGRPBadge
                name={`launch_badge`}
                variant={`outline`}
                color={`destructive`}
                badgeClassName={cn('font-normal text-xs text-red-800')}
              >
                Obrigatório (*)
              </IGRPBadge>
            </IGRPCardHeader>
            <IGRPCardContent className={cn('p-4')}>
              <IGRPForm
                schema={newLaunchRequest}
                formRef={formform_launchRef}
                className={cn('space-y-6')}
                onSubmit={async (values) => await onSubmit(values)}
                defaultValues={contentFormform_launch}
              >
                <>
                  <IGRPFormList
                    id={`launch_separator_list`}
                    name={`lancamento`}
                    label={`Lista de Beneficiários`}
                    description={`Lista de todos os beneficiários associados à declaração`}
                    badgeValue={`SOAT: ${infoDesconto?.soat ?? 'N/A'}%, Regime Geral: ${infoDesconto?.regimeGeral ?? 'N/A'}%`}
                    renderItem={(
                      _: (typeof initNewLaunchRequest)['lancamento'][0],
                      index: number,
                    ) => (
                      <>
                        <div
                          className={cn(
                            'grid',
                            'grid-cols-4 ',
                            'md:grid-cols-3 ',
                            'lg:grid-cols-4 ',
                            ' gap-4',
                          )}
                        >
                          <IGRPInputText
                            name={`lancamento.${index}.numeroBeneficiario`}
                            label={`Número de Beneficiário`}
                            placeholder={`Introduza o número`}
                            required={true}
                            className={cn('col-span-1')}
                          ></IGRPInputText>
                          <IGRPInputText
                            name={`lancamento.${index}.nomeBeneficiario`}
                            label={`Nome de Beneficiário`}
                            placeholder={`Introduza o nome`}
                            required={true}
                            className={cn('col-span-1')}
                          ></IGRPInputText>
                          <IGRPDatePicker
                            placeholder={`Escolha uma data`}
                            name={`lancamento.${index}.dataNascimento`}
                            id={`lancamento.${index}.dataNascimento`}
                            label={`Data de Nascimento`}
                            required={true}
                            className={cn('col-span-1')}
                          />
                          <IGRPInputNumber
                            name={`lancamento.${index}.diasTrabalho`}
                            label={`Dias de Trabalho`}
                            min={0}
                            required={true}
                            className={cn('col-span-1')}
                          ></IGRPInputNumber>
                          <IGRPInputNumber
                            name={`lancamento.${index}.salarioDiario`}
                            label={`Salário Diário`}
                            min={0}
                            required={true}
                            className={cn('col-span-1')}
                          ></IGRPInputNumber>
                          <IGRPInputNumber
                            name={`lancamento.${index}.outrasRemuneracoes`}
                            label={`Outras Remunerações`}
                            min={0}
                            required={false}
                            className={cn('col-span-1')}
                          ></IGRPInputNumber>
                          <IGRPInputNumber
                            name={`lancamento.${index}.totalMensal`}
                            label={`Total Mensal`}
                            min={0}
                            required={true}
                            className={cn('col-span-1')}
                          ></IGRPInputNumber>
                          <IGRPInputNumber
                            name={`lancamento.${index}.compRegimeGeral`}
                            label={`Comparticipação Regime Geral`}
                            min={0}
                            required={false}
                            className={cn('col-span-1')}
                          ></IGRPInputNumber>
                          <IGRPInputNumber
                            name={`lancamento.${index}.compSoat`}
                            label={`Comparticipação SOAT`}
                            min={0}
                            required={false}
                            className={cn('col-span-1')}
                          ></IGRPInputNumber>
                          <IGRPInputText
                            name={`lancamento.${index}.observacao`}
                            label={`Observação`}
                            placeholder={`Introduza observações`}
                            required={false}
                            className={cn('col-span-1')}
                          ></IGRPInputText>
                        </div>
                      </>
                    )}
                    computeLabel={(
                      item: (typeof initNewLaunchRequest)['lancamento'][0],
                      index: number,
                    ) =>
                      `Beneficiário ${item?.numeroBeneficiario ? item.numeroBeneficiario : ''} - ${item?.nomeBeneficiario ? item.nomeBeneficiario : ''}`
                    }
                    defaultItem={formListlancamentoDefault}
                  ></IGRPFormList>
                </>
              </IGRPForm>
            </IGRPCardContent>
          </IGRPCard>
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
                      name={`edit_launch_badge`}
                      variant={`outline`}
                      showIcon={true}
                      iconName={`CircleCheck`}
                      badgeClassName={cn('bg-blue-50 text-blue-700 border-blue-200')}
                    >
                      Editando Lançamento
                    </IGRPBadge>
                  )}
                  {!isEdit && (
                    <IGRPBadge
                      name={`new_launch_badge`}
                      variant={`outline`}
                      showIcon={true}
                      iconName={`Plus`}
                      badgeClassName={cn('bg-blue-50 text-blue-700 border-blue-200')}
                    >
                      Novo Lançamento
                    </IGRPBadge>
                  )}
                </>
                <p className={cn(' text-xs text-muted-foreground')}>
                  Preencha os campos obrigatórios marcados com *
                </p>
              </div>
              <div className={cn('flex', ' gap-3')}>
                {onCancel && (
                  <IGRPButton name={`footer_cancel_button`} variant={`outline`} onClick={onCancel}>
                    Cancelar
                  </IGRPButton>
                )}
                <IGRPButton
                  name={`button_form_tax_payer_submit`}
                  type={`submit`}
                  className={cn('min-w-[150px]')}
                  onClick={() => formform_launchRef.current?.submit()}
                  disabled={isSubmitting}
                >
                  {isSubmitting && <p className={cn(' animate-pulse')}>Processando...</p>}
                  {isEdit && !isSubmitting && <p className={cn()}>Salvar Alterações</p>}
                  {!isEdit && !isSubmitting && <p className={cn()}>Salvar Lançamento</p>}
                </IGRPButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
