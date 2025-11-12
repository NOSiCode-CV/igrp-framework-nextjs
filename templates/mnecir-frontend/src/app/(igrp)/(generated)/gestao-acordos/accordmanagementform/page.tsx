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
import {
  IGRPForm,
  IGRPHeadline,
  IGRPSelect,
  IGRPInputText,
  IGRPDatePicker,
  IGRPTextarea,
  IGRPFormList,
  IGRPInputFile,
} from '@igrp/igrp-framework-react-design-system';

export default function PageAccordmanagementformComponent() {
  const form1 = z.object({
    type: z.string().optional(),
    title: z.string().optional(),
    rr: z.string().optional(),
    year: z.number().optional(),
  });

  type Form1ZodType = typeof form1;

  const initForm1: z.infer<Form1ZodType> = {
    type: ``,
    title: ``,
    rr: ``,
    year: undefined,
  };

  const [form1Data, setForm1Data] = useState<any>(initForm1);
  const [selectselect1Options, setSelectselect1Options] = useState<IGRPOptionsProps[]>([]);
  const [selectselect2Options, setSelectselect2Options] = useState<IGRPOptionsProps[]>([]);
  const [selectselect3Options, setSelectselect3Options] = useState<IGRPOptionsProps[]>([]);
  const [selectselect4Options, setSelectselect4Options] = useState<IGRPOptionsProps[]>([]);
  const [selectselect5Options, setSelectselect5Options] = useState<IGRPOptionsProps[]>([]);
  const [selectselect6Options, setSelectselect6Options] = useState<IGRPOptionsProps[]>([]);
  const [selectselect7Options, setSelectselect7Options] = useState<IGRPOptionsProps[]>([]);
  const [formListformList1Default, setFormListformList1Default] = useState<any>({});
  const [selectselect8Options, setSelectselect8Options] = useState<IGRPOptionsProps[]>([]);
  const [formListformList2Default, setFormListformList2Default] = useState<any>({});
  const [selectselect9Options, setSelectselect9Options] = useState<IGRPOptionsProps[]>([]);
  const formform1Ref = useRef<IGRPFormHandle<Form1ZodType> | null>(null);

  const { igrpToast } = useIGRPToast();

  return (
    <div className={cn('page', 'space-y-6')}>
      <div className={cn('section', ' space-y-6')}>
        <IGRPForm
          schema={form1}
          validationMode={`onBlur`}
          formRef={formform1Ref}
          onSubmit={(e) => {}}
          defaultValues={form1Data}
        >
          <>
            <IGRPHeadline
              name={`headline1`}
              title={`Inserir Informação de Acordo, Tratado ou Convenção`}
              description={undefined}
              variant={`h3`}
              roleColor={`solid`}
              color={`primary`}
              showIcon={false}
            ></IGRPHeadline>
            <div
              className={cn('grid', 'grid-cols-1 ', 'md:grid-cols-2 ', 'lg:grid-cols-4 ', ' gap-4')}
            >
              <IGRPSelect
                name={`select1`}
                label={`Tipo`}
                placeholder={`Select an option...`}
                gridSize={`full`}
                onValueChange={() => {}}
                options={selectselect1Options}
              ></IGRPSelect>
              <IGRPSelect
                name={`select2`}
                label={`Título`}
                placeholder={`Select an option...`}
                gridSize={`full`}
                value={undefined}
                onValueChange={() => {}}
                options={selectselect2Options}
              ></IGRPSelect>
              <IGRPInputText
                name={`year`}
                label={`Ano`}
                showIcon={false}
                required={false}
              ></IGRPInputText>
              <IGRPSelect
                name={`select3`}
                label={`Natureza`}
                placeholder={`Select an option...`}
                gridSize={`full`}
                onValueChange={() => {}}
                options={selectselect3Options}
              ></IGRPSelect>
              <IGRPSelect
                name={`select4`}
                label={`Dominio`}
                placeholder={`Select an option...`}
                gridSize={`full`}
                onValueChange={() => {}}
                options={selectselect4Options}
              ></IGRPSelect>
              <IGRPSelect
                name={`select5`}
                label={`Fase`}
                placeholder={`Select an option...`}
                gridSize={`full`}
                onValueChange={() => {}}
                options={selectselect5Options}
              ></IGRPSelect>
              <IGRPDatePicker
                placeholder={`Please select a date...`}
                name={`inputDatePicker3`}
                id={`inputDatePicker3`}
                label={`Data de assinatura`}
                startDate={new Date(`1900-01-01`)}
                endDate={new Date(`2099-12-31`)}
                gridSize={`full`}
                dateFormat={`dd/MM/yyyy`}
                today={new Date(`2025-01-01`)}
                defaultMonth={new Date(`2025-01-01`)}
                startMonth={new Date(`2025-01-01`)}
                month={new Date(`2025-01-01`)}
                endMonth={new Date(`2025-12-31`)}
                numberOfMonths={1}
                captionLayout={`label`}
                className={cn()}
                onDateChange={(value) => {}}
              />
              <IGRPDatePicker
                placeholder={`Please select a date...`}
                name={`inputDatePicker2`}
                id={`inputDatePicker2`}
                label={`Date de Publicação no BO`}
                startDate={new Date(`1900-01-01`)}
                endDate={new Date(`2099-12-31`)}
                gridSize={`full`}
                dateFormat={`dd/MM/yyyy`}
                today={new Date(`2025-01-01`)}
                defaultMonth={new Date(`2025-01-01`)}
                startMonth={new Date(`2025-01-01`)}
                month={new Date(`2025-01-01`)}
                endMonth={new Date(`2025-12-31`)}
                numberOfMonths={1}
                captionLayout={`label`}
                className={cn()}
                onDateChange={(value) => {}}
              />
              <IGRPInputText
                name={`inputText1`}
                label={`Referencia do BO`}
                showIcon={false}
                required={false}
              ></IGRPInputText>
              <IGRPSelect
                name={`select6`}
                label={`Exige Ratificação?`}
                placeholder={`Select an option...`}
                gridSize={`full`}
                onValueChange={() => {}}
                options={selectselect6Options}
              ></IGRPSelect>
              <IGRPSelect
                name={`select7`}
                label={`Ratificado?`}
                placeholder={`Select an option...`}
                gridSize={`full`}
                onValueChange={() => {}}
                options={selectselect7Options}
              ></IGRPSelect>
              <IGRPTextarea
                name={`inputTextarea1`}
                label={`Observações sobre ratificação`}
                rows={3}
                required={false}
              ></IGRPTextarea>
              <IGRPDatePicker
                placeholder={`Please select a date...`}
                name={`inputDatePicker1`}
                id={`inputDatePicker1`}
                label={`Entrada em Vigor`}
                startDate={new Date(`1900-01-01`)}
                endDate={new Date(`2099-12-31`)}
                gridSize={`full`}
                dateFormat={`dd/MM/yyyy`}
                today={new Date(`2025-01-01`)}
                defaultMonth={new Date(`2025-01-01`)}
                startMonth={new Date(`2025-01-01`)}
                month={new Date(`2025-01-01`)}
                endMonth={new Date(`2025-12-31`)}
                numberOfMonths={1}
                captionLayout={`label`}
                className={cn()}
                onDateChange={(value) => {}}
              />
              <IGRPInputText
                name={`inputText2`}
                label={`Referência entrada em vigor`}
                showIcon={false}
                required={false}
              ></IGRPInputText>
            </div>
            <div
              className={cn(
                'grid',
                'grid-cols-2 ',
                'md:grid-cols-2 ',
                'lg:grid-cols-2 ',
                'block',
                'overflow-visiblestatic',
                ' gap-4',
              )}
            >
              <IGRPTextarea
                name={`inputTextarea2`}
                label={`Forma de aprovação`}
                rows={3}
                required={false}
                className={cn('col-span-1')}
              ></IGRPTextarea>
              <IGRPTextarea
                name={`inputTextarea3`}
                label={`Observações`}
                rows={3}
                required={false}
                className={cn('col-span-1')}
              ></IGRPTextarea>
            </div>
            <div
              className={cn('grid', 'grid-cols-1 ', 'md:grid-cols-2 ', 'lg:grid-cols-2 ', ' gap-4')}
            >
              <IGRPFormList
                id={`formlist_hhfqd0`}
                name={`formList1`}
                label={`País / Organização internacional`}
                color={`primary`}
                variant={`solid`}
                addButtonLabel={`Add`}
                addButtonIconName={`Plus`}
                badgeValue={`Form List`}
                renderItem={(_: any, index: number) => (
                  <>
                    <div
                      className={cn(
                        'grid',
                        'grid-cols-1',
                        'md:grid-cols-2',
                        'lg:grid-cols-4',
                        'gap-4',
                      )}
                    >
                      <IGRPSelect
                        name={`formList1.${index}.select8`}
                        label={`País / Organização Internacional`}
                        placeholder={`Select an option...`}
                        gridSize={`full`}
                        className={cn('col-span-1')}
                        onValueChange={() => {}}
                        options={selectselect8Options}
                      ></IGRPSelect>
                    </div>
                  </>
                )}
                computeLabel={(item: any, index: number) => `Item ${index}`}
                className={cn('col-span-1')}
                defaultItem={formListformList1Default}
              ></IGRPFormList>

              <IGRPFormList
                id={`formlist_3f9j92`}
                name={`formList2`}
                label={`Documentos`}
                color={`primary`}
                variant={`solid`}
                addButtonLabel={`Add`}
                addButtonIconName={`Plus`}
                badgeValue={`Form List`}
                renderItem={(_: any, index: number) => (
                  <>
                    <div
                      className={cn(
                        'grid',
                        'grid-cols-1 ',
                        'md:grid-cols-2 ',
                        'lg:grid-cols-2 ',
                        'overflow-visibleborder border-solid border-[#000000]relative',
                        ' gap-4',
                      )}
                    >
                      <IGRPSelect
                        name={`formList2.${index}.select9`}
                        label={`Tipo de Documento`}
                        placeholder={`Select an option...`}
                        gridSize={`full`}
                        className={cn('col-span-1')}
                        onValueChange={() => {}}
                        options={selectselect9Options}
                      ></IGRPSelect>
                      <IGRPInputFile
                        name={`formList2.${index}.inputFile1`}
                        label={`Documento`}
                        accept={`application/pdf`}
                        required={false}
                        className={cn('col-span-1')}
                      ></IGRPInputFile>
                    </div>
                  </>
                )}
                computeLabel={(item: any, index: number) => `Item ${index}`}
                className={cn('col-span-1')}
                defaultItem={formListformList2Default}
              ></IGRPFormList>
            </div>
          </>
        </IGRPForm>
      </div>
    </div>
  );
}
