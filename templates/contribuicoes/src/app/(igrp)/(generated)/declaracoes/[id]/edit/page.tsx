'use client';

/* THIS FILE WAS GENERATED AUTOMATICALLY BY iGRP STUDIO. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useRef } from 'react';
import { cn, useIGRPMenuNavigation, useIGRPToast } from '@igrp/igrp-framework-react-design-system';
import Declaracaoform from '@/app/(igrp)/(generated)/declaracoes/components/declaracaoform';
import { IGRPPageHeader, IGRPButton } from '@igrp/igrp-framework-react-design-system';
import { IGRPLoadingSpinner } from '@igrp/igrp-framework-react-design-system';
import { useDetalheDeclaracao } from '@/app/(myapp)/hooks/use-declaracao';
import { useRouter } from 'next/navigation';

export default function PageEditardeclaracaoComponent() {
  const [shouldSubmit, setShouldSubmit] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [formDeclaracaoInitialData, setFormDeclaracaoInitialData] = useState<any>(null);

  const router = useRouter();

  function handleAfterSubmit(): void | undefined {
    setShouldSubmit(false);
  }

  function handleSubmit(): void | undefined {
    setShouldSubmit(true);
  }

  const { data, isLoading, error } = useDetalheDeclaracao();
  console.log(data);

  useEffect(() => {
    if (isLoading) return;
    setFormDeclaracaoInitialData(data);
  }, [data, isLoading]);

  if (isLoading && !error) {
    return (
      <div className="flex items-center gap2 flex-col">
        <IGRPLoadingSpinner />
        <span> A carregar declaração...</span>
      </div>
    );
  }

  function handlebutton_cancelarNavigation(row?: any): void {
    router.push(`/declaracoes`);
  }

  return (
    <div className={cn('page')}>
      <div className={cn('flex', 'flex-col', ' min-h-full')}>
        <IGRPPageHeader
          title={`Editar Declaração`}
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
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting && <p className={cn(' animate-pulse')}>Processando...</p>}
              {!isSubmitting && <p className={cn()}>Salvar Alterações</p>}
            </IGRPButton>
          </div>
        </IGRPPageHeader>

        <Declaracaoform
          isEdit={true}
          shouldSubmit={shouldSubmit}
          isSubmitting={isSubmitting}
          initialData={formDeclaracaoInitialData}
          onAfterSubmit={handleAfterSubmit}
          setIsSubmitting={setIsSubmitting}
        ></Declaracaoform>
      </div>
    </div>
  );
}
