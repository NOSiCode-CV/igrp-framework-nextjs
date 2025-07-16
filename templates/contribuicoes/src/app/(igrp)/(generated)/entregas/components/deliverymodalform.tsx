'use client'

/* THIS FILE WAS GENERATED AUTOMATICALLY BY iGRP STUDIO. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { use, useState, useEffect, useRef } from 'react';
import { cn, useIGRPMenuNavigation, useIGRPToast } from '@igrp/igrp-framework-react-design-system';
import { IGRPFormHandle } from "@igrp/igrp-framework-react-design-system";
import { z } from "@igrp/igrp-framework-react-design-system"
import { IGRPOptionsProps } from "@igrp/igrp-framework-react-design-system";
import {
  IGRPModalDialog,
  IGRPModalDialogContent,
  IGRPModalDialogHeader,
  IGRPHeadline,
  IGRPForm,
  IGRPCard,
  IGRPCardHeader,
  IGRPIcon,
  IGRPBadge,
  IGRPCardContent,
  IGRPCombobox,
  IGRPSelect,
  IGRPModalDialogFooter,
  IGRPButton
} from "@igrp/igrp-framework-react-design-system";
import { DeclaracaoStatus } from "@/app/(myapp)/types/declaracao";
import { Declaracao } from "@/app/(myapp)/types/declaracao";
import { createOrUpdateDeclaracao } from '@/app/(myapp)/hooks/use-declaracao'
import { useRouter } from "next/navigation";
import { getContribuintes } from "@/app/(myapp)/actions/mock-actions";
import { getMesesReferencia } from "@/app/(myapp)/actions/mock-actions";
import { useNewDeclaracaoParameterizations } from "@/app/(myapp)/hooks/use-parametrization"

export default function Deliverymodalform({ isOpen, setIsOpen, initialData }: { isOpen: boolean, setIsOpen: (prompt: boolean) => void, initialData?: any }) {


  const declaracaoStatus = z.enum(['POR_ENTREGAR', 'SUBMETIDA', 'VERIFICADA', 'PROCESSADA', 'VALIDADA'])

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
    observacao: z.string().optional()
  })

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
    estadoDeclaracao: "POR_ENTREGAR",
    estadoDeclaracaoDesc: ``,
    observacao: ``
  }


  const formform_declarationsRef = useRef<IGRPFormHandle<DeclaracaoZodType> | null>(null);
  const [contentFormform_declarations, setContentFormform_declarations] = useState<z.infer<DeclaracaoZodType>>(initDeclaracao);
  const [comboboxContribuinteIdOptions, setComboboxContribuinteIdOptions] = useState<IGRPOptionsProps[]>([]);
  const [selectMesReferenciaOptions, setSelectMesReferenciaOptions] = useState<IGRPOptionsProps[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { igrpToast } = useIGRPToast()

  async function onSubmit(values: z.infer<any>): Promise<void> {



    const declaracao: any = {
      ...values,
      declaracaoId: initialData?.declaracaoId
    };

    setIsSubmitting(true)

    try {
      await createOrUpdateDeclaracao(declaracao)
      igrpToast({
        title: "Entrega adicionada",
        description: `Entrega ${values.declaracaoId} foi adicionada com sucesso.`,
      })
      router.push('/declaracoes');
    } catch (error) {
      igrpToast({
        title: "Erro",
        description: "Ocorreu um erro ao processar o formulário.",
        type: "error",
      })
      console.log(error);
    } finally {
      setIsSubmitting(false)
    }



  }

  function onCancel(): void {





  }







  const router = useRouter()

  const { isLoading } = useNewDeclaracaoParameterizations();

  useEffect(() => {

    if (isLoading) return;
    loadFormFields()

  }, [isLoading])

  useEffect(() => {
    if (initialData) {
      setContentFormform_declarations(initialData)
    }
  }, [initialData])

  const loadFormFields = async () => {

    setComboboxContribuinteIdOptions(await getContribuintes())
    setSelectMesReferenciaOptions(await getMesesReferencia())

  }




  return (
    <div className={cn('component',)}    >
      <IGRPModalDialog
        onOpenChange={setIsOpen}
        open={isOpen}
      >
        <IGRPModalDialogContent
          className={cn('col-span-5',)}
        >
          <IGRPModalDialogHeader
          >
            <IGRPHeadline
              name={`modal_headline`}
              variant={`h5`}
              title={`Nova Entrega`}
            >
            </IGRPHeadline>
          </IGRPModalDialogHeader>
          <div className={cn(' relative',)}    >
            <IGRPForm
              schema={declaracao}
              formRef={formform_declarationsRef}
              className={cn('space-y-6',)}
              onSubmit={async (values) => await onSubmit(values)}
              defaultValues={contentFormform_declarations}
            >
              <>
                <IGRPCard
                  name={`basic_information_card`}


                  className={cn('shadow-sm',)}
                >
                  <IGRPCardHeader
                    className={cn('border-b flex flex-row items-center justify-between',)}
                  >
                    <div className={cn('flex', 'flex-row', ' justify-between',)}    >
                      <div className={cn(' py-3',)}    >
                        <IGRPIcon
                          name={`basic_information_building_icon`}
                          iconName={`Building`}

                          className={cn('h-6 w-6 text-muted-foreground',)}
                        >
                        </IGRPIcon></div>
                      <div className={cn(' px-5',)}    >
                        <IGRPHeadline
                          name={`basic_information_headline`}
                          variant={`h6`}
                          title={`Informações Básicas`}
                          description={`Dados principais da declaração`}
                        >
                        </IGRPHeadline></div></div>
                    <IGRPBadge
                      name={`basic_information_badge`}
                      variant={`outline`}
                      color={`destructive`}


                      badgeClassName={cn('font-normal text-xs text-red-800',)}
                    >
                      Obrigatório (*)
                    </IGRPBadge>
                  </IGRPCardHeader>
                  <IGRPCardContent
                    className={cn('p-4',)}
                  >
                    <div className={cn('grid', 'grid-rows-2 ', ' gap-2',)}    >
                      <IGRPCombobox
                        name={`contribuinteId`}
                        label={`Nº de Contribuinte`}
                        placeholder={`Escolha o contribuinte`}
                        required={true}
                        showSearch={true}
                        className={cn('row-span-1',)}
                        options={comboboxContribuinteIdOptions}
                      >
                      </IGRPCombobox>
                      <IGRPSelect
                        name={`mesReferencia`}
                        label={`Mês de Referência`}
                        placeholder={`Escolha o mês de referência`}
                        required={true}
                        showSearch={true}
                        className={cn('row-span-1',)}
                        options={selectMesReferenciaOptions}
                      >
                      </IGRPSelect></div>
                  </IGRPCardContent>
                </IGRPCard>
              </>
            </IGRPForm></div>
          <IGRPModalDialogFooter
            className={cn('sm:flex justify-end',)}
          >
            <IGRPButton
              name={`button_form_tax_payer_submit`}
              type={`submit`}

              className={cn('min-w-[150px]',)}
              onClick={() => formform_declarationsRef.current?.submit()}
              disabled={isSubmitting}
            >
              {isSubmitting && (<p className={cn(' animate-pulse',)}    >
                Processando...</p>)}
              {!isSubmitting && (<p className={cn()}    >
                Salvar Entrega</p>)}
            </IGRPButton>
          </IGRPModalDialogFooter>
        </IGRPModalDialogContent>
      </IGRPModalDialog></div>
  );
}