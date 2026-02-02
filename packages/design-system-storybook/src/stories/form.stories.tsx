/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useCallback, useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import {
  IGRPForm,
  type IGRPFormHandle,
  IGRPFormFieldPrimitive,
  IGRPFormItemPrimitive,
  IGRPFormLabelPrimitive,
  IGRPFormControlPrimitive,
  IGRPFormMessagePrimitive,
  IGRPButtonPrimitive,
  IGRPInputPrimitive,
  IGRPCheckbox,
  IGRPCombobox,
  IGRPInputFile,
  IGRPInputHidden,
  IGRPInputNumber,
  IGRPInputText,
  IGRPTextarea,
  cn,
  IGRPMenuNavigation,
  useIGRPMenuNavigation,
  IGRPAlert,
  IGRPHeadline,
  IGRPText,
  IGRPCard,
  IGRPCardContent,
  IGRPCardHeader,
  IGRPFormList,
  type IGRPOptionsProps,
  IGRPDatePickerInputSingle,
} from '@igrp/igrp-framework-react-design-system';

const meta: Meta<typeof IGRPForm> = {
  title: 'Components/Form',
  component: IGRPForm,
};
export default meta;

// ─── Schemas ─────────────────────────────────────────────────────────
const basicSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.email('Invalid email'),
  age: z.coerce.number().min(1, 'Age must be at least 1'),
  remember: z.boolean().optional(),
  uuid: z.string().optional(),
});

const advancedSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  age: z.coerce.number().min(0),
  phone: z.string().min(8),
  address: z.string().min(5),
  city: z.string().min(2),
});

// ─── Fields ───────────────────────────────────────────────────────────
const BasicFields = () => (
  <>
    <IGRPInputHidden name='uuid' />
    <IGRPInputText
      name='name'
      label='Name'
      placeholder='John Doe'
      required
    />
    <IGRPInputText
      name='email'
      label='Email'
      placeholder='you@example.com'
      type='email'
      required
    />
    <IGRPInputNumber
      name='age'
      label='Age'
      placeholder='30'
      required
    />
    <IGRPCheckbox
      name='remember'
      label='Remember me'
    />
  </>
);

const AdvancedFields = () => (
  <>
    {[
      { name: 'firstName', label: 'First Name' },
      { name: 'lastName', label: 'Last Name' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'age', label: 'Age', type: 'number' },
      { name: 'phone', label: 'Phone', type: 'tel' },
      { name: 'address', label: 'Address' },
      { name: 'city', label: 'City' },
    ].map(({ name, label, type }) => (
      <IGRPFormFieldPrimitive
        key={name}
        name={name}
        render={({ field }) => (
          <IGRPFormItemPrimitive className='col-span-12 sm:col-span-6'>
            <IGRPFormLabelPrimitive>{label}</IGRPFormLabelPrimitive>
            <IGRPFormControlPrimitive>
              <IGRPInputPrimitive
                type={type}
                {...field}
              />
            </IGRPFormControlPrimitive>
            <IGRPFormMessagePrimitive />
          </IGRPFormItemPrimitive>
        )}
      />
    ))}
  </>
);

const tipoContato: IGRPOptionsProps[] = [
  { label: 'email', value: 'MAIL' },
  { label: 'telefone', value: 'PHONE' },
];

const tipoEndereco: IGRPOptionsProps[] = [
  { label: 'principal', value: 'SEDE' },
  { label: 'secundario', value: 'SECUNDARIO' },
];

const tiposDocumento: IGRPOptionsProps[] = [
  { label: 'nif', value: 'NIF' },
  { label: 'cif', value: 'CIF' },
];

const tiposActividades: IGRPOptionsProps[] = [
  { label: 'INDÚSTRIA DE MADEIRA', value: '1' },
  { label: 'actividade 2', value: '2' },
];

const geografias: IGRPOptionsProps[] = [
  { value: '4', label: 'RESIDÊNCIA EM BISSAU' },
  { value: '', label: 'RESIDÊNCIA EM BAFATA' },
];

const tiposAnexos: IGRPOptionsProps[] = [
  { value: '7', label: 'Alvará ou Licenciamento' },
  { value: '5', label: 'Teste' },
];

const tiposEstaduto: IGRPOptionsProps[] = [
  { label: 'ENI', value: 'ENI' },
  { label: 'AAA', value: 'AAA' },
];

const bancos: IGRPOptionsProps[] = [
  { value: '1', label: 'ECOBANK' },
  { label: '2', value: 'BAO' },
];

const tiposRespresentacao: IGRPOptionsProps[] = [
  { value: 'S', label: 'Sede' },
  { label: 'R', value: 'R' },
];

const sedes: IGRPOptionsProps[] = [];

const mockData = {
  numero: 200000001,
  tipoRepresentacao: 'S',
  tipoRepresentacaoDesc: 'Sede',
  contribuinteId: '01977aee-088b-7fc3-a76e-558afc4946f9',
  sedeId: null,
  tipoDocumento: 'NIF',
  numDocumentoInscricao: 'qwqwqw',
  nomeComercial: 'wqqww',
  nomeResponsavel: 'qwqw',
  denominacaoSocial: 'qwqwqw',
  dataInicioAtividade: '2025-06-10',
  soat: '0.00',
  observacao: '2121221',
  estatutoJuridico: 'Emp. Nome Individual - Estab. estável EIRL',
  codigoEstatuto: 'ENI',
  regimeId: 1,
  regime: 'Instituto Nacional de Segurança Social',
  estado: 'Activo',
  dataEntrada: '2025-06-16',
  actividadesEconomicas: [
    {
      id: 3,
      idActividadeEconomica: 1,
      principal: false,
      designacao: 'INDÚSTRIA DE MADEIRA',
      estado: null,
    },
  ],
  contactos: [
    {
      id: 3,
      contacto: 'qwwq',
      tipoContacto: 'MAIL',
      tipoContactoDesc: 'Email',
      estado: null,
    },
  ],
  enderecos: [
    {
      id: 1,
      tipoEndereco: 'SEDE',
      tipoEnderecoDesc: 'Sede',
      idGeografia: 4,
      descGeografia: 'RESIDÊNCIA EM BISSAU',
      rua: 'wq',
      numPorta: 'wq',
      pontoRef: 'wq',
      pais: null,
      caixaPostal: 'wq',
      estado: null,
    },
  ],
  dadosBancarios: [
    {
      id: 2,
      nib: '212112',
      numConta: '9999999',
      idAgencia: null,
      idOperadora: 1,
      operadoraDesc: 'ECOBANK',
      estado: null,
    },
  ],
  sucursal: [],
  beneficiarios: [
    {
      externalID: '6d39cdb2-c3af-4bfe-b104-30ffab6ebba4',
      numeroUtente: '120000003',
      nome: 'voluptate nostrud sed reprehenderit',
      dataNascimento: '1963-08-16',
      nomePai: 'dolor est',
      nomeMae: 'proident enim',
      estado: null,
    },
    {
      externalID: 'b1561cf6-05d4-4e60-85e7-2761ad4705af',
      numeroUtente: '120000005',
      nome: '323123123',
      dataNascimento: '2025-06-11',
      nomePai: '321312',
      nomeMae: '31231',
      estado: null,
    },
  ],
  anexos: [
    {
      id: 1,
      url: 'teste',
      idTipoDocumento: 7,
      descricaoTipoDocumento: 'Alvará ou Licenciamento',
    },
  ],
};

// ─── Stories ──────────────────────────────────────────────────────────

export const BasicExternalTrigger: StoryObj = {
  name: 'Basic - External Submit Button',
  render: () => {
    const formRef = useRef<IGRPFormHandle<typeof basicSchema> | null>(null);
    return (
      <div className='space-y-4 p-10'>
        <IGRPForm
          schema={basicSchema}
          onSubmit={(values) => alert(`Submitted externally: ${JSON.stringify(values)}`)}
          formRef={formRef}
        >
          <BasicFields />
        </IGRPForm>
        <IGRPButtonPrimitive onClick={() => formRef.current?.submit()}>
          Submit Externally
        </IGRPButtonPrimitive>
      </div>
    );
  },
};

export const AdvancedExternalTrigger: StoryObj = {
  name: 'Advanced - External Submit Button',
  render: () => {
    const formRef = useRef<IGRPFormHandle<typeof advancedSchema>>(null);
    return (
      <div className='space-y-4'>
        <IGRPForm
          schema={advancedSchema}
          onSubmit={(values) => console.log('Advanced External Submit:', values)}
          formRef={formRef}
        >
          <AdvancedFields />
        </IGRPForm>
        <IGRPButtonPrimitive
          onClick={() =>
            formRef.current?.handleSubmit((values) => console.log('Submit from button:', values))()
          }
        >
          Finish
        </IGRPButtonPrimitive>
      </div>
    );
  },
};

export const FormExamples: StoryObj = {
  render: () => {
    const formContribuinte = z.object({
      tipoDocumento: z.string(),
      numDocumentoInscricao: z.string(),
      denominacaoSocial: z.string(),
      nomeComercial: z.string(),
      codigoEstatuto: z.string(),
      tipoRepresentacao: z.string(),
      nomeResponsavel: z.string(),
      dataInicioAtividade: z.date(),
      uuidSede: z.string().optional(),
      soatUsado: z.string().optional(),
      actividadesEconomicas: z
        .array(
          z.object({
            idActividadeEconomica: z.number(),
            soat: z.number().optional(),
            nivelActividade: z.boolean().optional(),
          }),
        )
        .optional(),
      enderecos: z
        .array(
          z.object({
            tipoEndereco: z.string(),
            rua: z.string(),
            pontoRef: z.string(),
            idGeografia: z.number(),
            caixaPostal: z.string().optional(),
            numPorta: z.string().optional(),
          }),
        )
        .optional(),
      contactos: z.array(z.object({ tipoContacto: z.string(), contacto: z.string() })).optional(),
      dadosBancarios: z
        .array(z.object({ idOperadora: z.number(), nib: z.number(), numConta: z.number() }))
        .optional(),
      anexos: z
        .array(
          z.object({
            idTipoDocumento: z.number(),
            upload: z.string().optional(),
            url: z.string().optional(),
          }),
        )
        .optional(),
      observacao: z.string(),
    });

    const formRef = useRef<IGRPFormHandle<typeof formContribuinte>>(null);

    const [contentFormform1, setContentFormform1] = useState<z.infer<any>>();

    const [selecttipoDocumentoOptions, setSelecttipoDocumentoOptions] = useState<
      IGRPOptionsProps[]
    >([]);
    const [selecttipoDocumentoValue, setSelecttipoDocumentoValue] = useState<string>('');
    const [selectcodigoEstatutoValue, setSelectcodigoEstatutoValue] = useState<string>('');
    const [selectcodigoEstatutoOptions, setSelectcodigoEstatutoOptions] = useState<
      IGRPOptionsProps[]
    >([]);
    const [selecttipoRepresentacaoValue, setSelecttipoRepresentacaoValue] = useState<string>('');
    const [selecttipoRepresentacaoOptions, setSelecttipoRepresentacaoOptions] = useState<
      IGRPOptionsProps[]
    >([]);
    const [selectuuidSedeOptions, setSelectuuidSedeOptions] = useState<IGRPOptionsProps[]>([]);
    const [selectidActividadeEconomicaOptions, setSelectidActividadeEconomicaOptions] = useState<
      IGRPOptionsProps[]
    >([]);
    const [selecttipoEnderecoValue, setSelecttipoEnderecoValue] = useState<string>('');
    const [selecttipoEnderecoOptions, setSelecttipoEnderecoOptions] = useState<IGRPOptionsProps[]>(
      [],
    );
    const [selectidGeografiaValue, setSelectidGeografiaValue] = useState<string>('');
    const [selectidGeografiaOptions, setSelectidGeografiaOptions] = useState<IGRPOptionsProps[]>(
      [],
    );

    const [selecttipoContactoValue, setSelecttipoContactoValue] = useState<string>('');
    const [selecttipoContactoOptions, setSelecttipoContactoOptions] = useState<IGRPOptionsProps[]>(
      [],
    );
    const [selectidOperadoraValue, setSelectidOperadoraValue] = useState<string>('');
    const [selectidOperadoraOptions, setSelectidOperadoraOptions] = useState<IGRPOptionsProps[]>(
      [],
    );
    const [selectidTipoDocumentoValue, setSelectidTipoDocumentoValue] = useState<string>('');
    const [selectidTipoDocumentoOptions, setSelectidTipoDocumentoOptions] = useState<
      IGRPOptionsProps[]
    >([]);

    const [actividadesEconomicasBadgeValue, setActividadesEconomicasBadgeValue] =
      useState<string>('SOAT Ponderado: 0.00%');

    const [actividadesEconomicas, setActividadesEconomicas] = useState<any>(undefined);
    const [isLoading, setIsLoading] = useState(false);

    const [selectuuidSedeValue, setSelectuuidSedeValue] = useState<string>('');
    const [selectidActividadeEconomicaValue, setSelectidActividadeEconomicaValue] =
      useState<string>('');

    const { getSectionRef } = useIGRPMenuNavigation();

    const calculeSOATPoderado = useCallback(() => {
      if (actividadesEconomicas && actividadesEconomicas.length > 0) {
        const total = actividadesEconomicas.reduce(
          (sum: number, act: any) => sum + (Number.parseFloat(act.soat) || 0),
          0,
        );
        const weighted = (total / actividadesEconomicas.length).toFixed(2);
        return weighted;
      } else {
        return '0.00';
      }
    }, [actividadesEconomicas]);

    function updateActividade(value: string, index: number): void | undefined {
      // Find the selected CAE code
      const selectedCae = tiposActividades.find((cae) => cae.value === value);

      // Get current form values
      const currentValues = formRef.current?.getValues();

      // Create the updated atividadesEconomicas array
      const updatedAtividades = [...(currentValues?.actividadesEconomicas || [])];
      if (selectedCae && index !== undefined && index >= 0) {
        updatedAtividades[index] = {
          ...updatedAtividades[index],
          // soat: selectedCae.metadata.taxa,
        };
      }

      formRef.current?.setValue('actividadesEconomicas', updatedAtividades);

      const weighted = calculeSOATPoderado();

      formRef.current?.setValue('soatUsado', weighted);
    }

    useEffect(() => {
      setIsLoading(true);
      setSelecttipoDocumentoOptions(tiposDocumento || []);
      setSelecttipoEnderecoOptions(tipoEndereco || []);
      setSelecttipoContactoOptions(tipoContato || []);
      setSelectcodigoEstatutoOptions(tiposEstaduto || []);
      setSelectidOperadoraOptions(bancos || []);
      setSelectidTipoDocumentoOptions(tiposAnexos || []);
      setSelectidActividadeEconomicaOptions(tiposActividades || []);
      setSelectidGeografiaOptions(geografias || []);
      setSelecttipoRepresentacaoOptions(tiposRespresentacao || []);
      setSelectuuidSedeOptions(sedes || []);
      setIsLoading(false);
    }, [isLoading]);

    useEffect(() => {
      if (formRef.current) {
        const subscription = formRef.current.watch((value) => {
          setActividadesEconomicas(value.actividadesEconomicas);
        });

        return () => subscription.unsubscribe();
      }
    }, []);

    useEffect(() => {
      setContentFormform1(mockData);
    }, []);

    useEffect(() => {
      if (actividadesEconomicas) {
        const weighted = calculeSOATPoderado();
        setActividadesEconomicasBadgeValue(`SOAT Ponderado:${weighted}%`);
      }
    }, [actividadesEconomicas, calculeSOATPoderado]);

    return (
      <div className='space-y-4'>
        <IGRPForm
          schema={formContribuinte}
          validationMode='onBlur'
          onSubmit={(values) => console.log('Advanced External Submit:', values)}
          formRef={formRef}
          gridClassName='grid-cols-12'
          defaultValues={contentFormform1}
        >
          <>
            <div className={cn('col-span-3 flex flex-col gap-6')}>
              <IGRPMenuNavigation
                title={'Menu'}
                badgeContent={'Novo'}
                badgeVariant={'solid'}
                badgeColor={'secondary'}
                activeSection='identificacao'
                className='top-32'
                sections={[
                  {
                    id: 'identificacao',
                    label: 'Informações Básicas',
                    icon: 'Building',
                  },
                  {
                    id: '',
                    label: 'Sector de Actividade/SOAT',
                    icon: 'Briefcase',
                  },
                  {
                    id: 'residencia',
                    label: 'Endereços',
                    icon: 'MapPin',
                  },
                  {
                    id: 'formList1',
                    label: 'Contacto',
                    icon: 'Phone',
                  },
                  {
                    id: 'contaBancaria',
                    label: 'Dados Bancários',
                    icon: 'CreditCard',
                  },
                  {
                    id: 'documentos',
                    label: 'Documentos',
                    icon: 'FileText',
                  },
                  {
                    id: 'obs',
                    label: 'Observaçōes',
                    icon: 'MessageSquare',
                  },
                ]}
              />
              <IGRPAlert
                color='info'
                variant='soft'
                iconName='Dot'
                linkIcon={'ArrowRight'}
              >
                <IGRPText
                  name={`text3`}
                  variant={'info'}
                  weight={'semibold'}
                  spacing={'none'}
                >
                  Dicas
                </IGRPText>
                <IGRPText
                  name={`text2`}
                  variant={'info'}
                  size={'sm'}
                  spacing={'normal'}
                >
                  Preencha todos os campos obrigatórios marcados com * e utilize a navegação lateral
                  para se mover entre as seções.
                </IGRPText>
              </IGRPAlert>
            </div>
            <div className='col-span-9 flex flex-col gap-6'>
              <IGRPCard
                name='identificacao'
                ref={getSectionRef('identificacao')}
                data-section-id={'identificacao'}
              >
                <IGRPCardHeader>
                  <IGRPHeadline
                    name={`headline1`}
                    title={'Informações Básicas'}
                    description={'Dados principais do contribuinte'}
                    variant={'h5'}
                    showIcon={true}
                    iconName={'Building'}
                    className={cn(
                      'mt-3',
                      'flex flex-row flex-nowrap items-stretch justify-start gap-2',
                      'bg-[#FFFFFF] bg-cover bg-center bg-no-repeat bg-scroll mix-blend-normal',
                    )}
                  />
                </IGRPCardHeader>
                <IGRPCardContent className='space-3 block'>
                  <div className='grid grid-cols-3 grid-rows-1 justify-items-stretch items-start gap-4'>
                    <IGRPCombobox
                      name={`tipoDocumento`}
                      label={'Tipo de documento de inscrição'}
                      required={true}
                      className={cn('col-span-1')}
                      onChange={() => setSelecttipoDocumentoValue}
                      value={selecttipoDocumentoValue}
                      options={selecttipoDocumentoOptions}
                    />
                    <IGRPInputText
                      name={`numDocumentoInscricao`}
                      label={'Número de documento de inscrição'}
                      disabled={false}
                      required={true}
                      className={cn('col-span-1')}
                    />
                    <IGRPInputText
                      name={`denominacaoSocial`}
                      label={'Denominação Social'}
                      disabled={false}
                      required={true}
                      className={cn('col-span-1')}
                    />
                    <IGRPInputText
                      name={`nomeComercial`}
                      label={'Nome Comercial'}
                      disabled={false}
                      required={true}
                      className={cn('col-span-1')}
                    />
                    <IGRPCombobox
                      name={`codigoEstatuto`}
                      label={'Estatuto Juridico'}
                      required={true}
                      className={cn('col-span-1')}
                      onChange={() => setSelectcodigoEstatutoValue}
                      value={selectcodigoEstatutoValue}
                      options={selectcodigoEstatutoOptions}
                    />
                    <IGRPCombobox
                      name={`tipoRepresentacao`}
                      label={'Tipo de representação'}
                      required={true}
                      className={cn('col-span-1')}
                      onChange={() => setSelecttipoRepresentacaoValue}
                      value={selecttipoRepresentacaoValue}
                      options={selecttipoRepresentacaoOptions}
                    />
                    <IGRPInputText
                      name={`nomeResponsavel`}
                      label={'Nome do Responsável'}
                      disabled={false}
                      required={true}
                      className={cn('col-span-1')}
                    />
                    {/* <IGRPDatePicker
                      placeholder='Please select a date...'
                      name={`dataInicioAtividade`}
                      id={`dataInicioAtividade`}
                      label='Data de Início de Atividade'
                      startDate={new Date('1900-01-01')}
                      endDate={new Date('2099-12-31')}
                      required={true}
                      today={new Date('2025-01-01')}
                      defaultMonth={new Date('2025-01-01')}
                      startMonth={new Date('2025-01-01')}
                      month={new Date('2025-01-01')}
                      endMonth={new Date('2025-12-31')}
                      className={cn('col-span-1')}
                    /> */}
                    <IGRPDatePickerInputSingle
                      placeholder='Please select a date...'
                      name={`dataInicioAtividadeSingle`}
                      id={`dataInicioAtividadeSingle`}
                      label='Data de Início de Atividade'
                      disableBefore={new Date('1900-01-01')}
                      disableAfter={new Date('2099-12-31')}
                      defaultMonth={new Date('2025-01-01')}
                      dateFormat={`dd/MM/yyyy`}
                      className={cn('col-span-1')}
                      required={true}
                    ></IGRPDatePickerInputSingle>
                  </div>
                  {selecttipoRepresentacaoValue === 'F' && (
                    <div className='grid grid-cols-3 grid-rows-1 gap-2 justify-items-stretch items-start border rounded-sm p-2'>
                      <IGRPText
                        name='text1'
                        variant='primary'
                        weight='semibold'
                        size='sm'
                        spacing='normal'
                      >
                        Informações da SEDE
                      </IGRPText>
                      <IGRPCombobox
                        name={`uuidSede`}
                        label={'Contribuinte SEDE'}
                        required={true}
                        onChange={() => setSelectuuidSedeValue}
                        value={selectuuidSedeValue}
                        options={selectuuidSedeOptions}
                      />
                    </div>
                  )}
                  <IGRPInputHidden
                    name={`soatUsado`}
                    label={'soatUsado'}
                    disabled={false}
                    required={false}
                  />
                </IGRPCardContent>
              </IGRPCard>
              <IGRPFormList
                id='formlist_4ayxgn'
                name={`actividadesEconomicas`}
                label={'Sector de Actividade/SOAT'}
                description={'Atividades econômicas do contribuinte'}
                color={'primary'}
                variant={'solid'}
                addButtonLabel={'Add'}
                iconName={'Briefcase'}
                addButtonIconName={'Plus'}
                renderItem={(_: any, index: number) => (
                  <>
                    <div className='grid grid-cols-2 gap-4'>
                      <IGRPCombobox
                        name={`actividadesEconomicas.${index}.idActividadeEconomica`}
                        label={'Actividade'}
                        required={true}
                        className={cn('col-span-1')}
                        onChange={(value) => {
                          updateActividade(value as string, index);
                          setSelectidActividadeEconomicaValue(value as string);
                        }}
                        value={selectidActividadeEconomicaValue}
                        options={selectidActividadeEconomicaOptions}
                      />
                      <IGRPInputNumber
                        name={`actividadesEconomicas.${index}.soat`}
                        label={'SOAT'}
                        min={0}
                        max={9999999}
                        required={true}
                        className={cn('col-span-1')}
                      />
                      <IGRPCheckbox
                        name={`actividadesEconomicas.${index}.nivelActividade`}
                        label={'Principal'}
                        className={cn('col-span-1')}
                        checked={undefined}
                      />
                    </div>
                  </>
                )}
                computeLabel={(_: any, index: number) => `Item ${index}`}
                defaultItem={undefined}
                badgeValue={actividadesEconomicasBadgeValue}
              />

              <IGRPFormList
                id={'formlist_x67fp6'}
                name={`enderecos`}
                label={'Endereços'}
                description={'Endereços do contribuinte'}
                color={'primary'}
                variant={'solid'}
                addButtonLabel={'Add'}
                iconName={'MapPin'}
                addButtonIconName={'Plus'}
                renderItem={(_: any, index: number) => (
                  <>
                    <div className='grid grid-cols-3 gap-4'>
                      <IGRPCombobox
                        name={`enderecos.${index}.tipoEndereco`}
                        label={'Tipo de Endereço'}
                        required={true}
                        className={cn('col-span-1')}
                        onChange={() => setSelecttipoEnderecoValue}
                        value={selecttipoEnderecoValue}
                        options={selecttipoEnderecoOptions}
                      />
                      <IGRPInputText
                        name={`enderecos.${index}.rua`}
                        label={'Endereço'}
                        required={true}
                        className={cn('col-span-1')}
                      />
                      <IGRPInputText
                        name={`enderecos.${index}.pontoRef`}
                        label={'Ponto Referência'}
                        required={true}
                        className={cn('col-span-1')}
                      />
                      <IGRPCombobox
                        name={`enderecos.${index}.idGeografia`}
                        label={'Região'}
                        required={true}
                        className={cn('col-span-1')}
                        onChange={() => setSelectidGeografiaValue}
                        value={selectidGeografiaValue}
                        options={selectidGeografiaOptions}
                      />
                      <IGRPInputText
                        name={`enderecos.${index}.caixaPostal`}
                        label={'Caixa Postal'}
                        required={false}
                        className={cn('col-span-1')}
                      />
                      <IGRPInputText
                        name={`enderecos.${index}.numPorta`}
                        label={'Numero de Porta'}
                        required={false}
                        className={cn('col-span-1')}
                      />
                    </div>
                  </>
                )}
                computeLabel={(_: any, index: number) => `Item ${index}`}
                defaultItem={undefined}
              />

              <IGRPFormList
                ref={getSectionRef('contactos')}
                data-section-id={'contactos'}
                id={'formlist_j5e1ei'}
                name={`contactos`}
                label={'Contactos'}
                color={'primary'}
                variant={'solid'}
                addButtonLabel={'Add'}
                iconName={'Phone'}
                renderItem={(_: any, index: number) => (
                  <>
                    <div className='grid grid-cols-2 grid-rows-1 justify-items-stretch items-start gap-4'>
                      <IGRPCombobox
                        name={`contactos.${index}.tipoContacto`}
                        label={'Tipo de Contato'}
                        required={true}
                        className={cn('col-span-1')}
                        onChange={() => setSelecttipoContactoValue}
                        value={selecttipoContactoValue}
                        options={selecttipoContactoOptions}
                      />
                      <IGRPInputText
                        name={`contactos.${index}.contacto`}
                        label={'Contacto'}
                        required={false}
                        className={cn('col-span-1')}
                      />
                    </div>
                  </>
                )}
                computeLabel={(_: any, index: number) => `Item ${index}`}
                className={cn('md:grid-cols-2', 'block')}
                defaultItem={undefined}
              />

              <IGRPFormList
                id={'formlist_3flio8'}
                name={`dadosBancarios`}
                label={'Dados Bancários'}
                description={'Informações bancárias do contribuinte'}
                color={'primary'}
                variant={'solid'}
                addButtonLabel={'Add'}
                iconName={'CreditCard'}
                addButtonIconName={'Plus'}
                renderItem={(_: any, index: number) => (
                  <>
                    <div className='grid grid-cols-3 gap-4'>
                      <IGRPCombobox
                        name={`dadosBancarios.${index}.idOperadora`}
                        label={'Banco'}
                        required={true}
                        className={cn('col-span-1')}
                        onChange={() => setSelectidOperadoraValue}
                        value={selectidOperadoraValue}
                        options={selectidOperadoraOptions}
                      />
                      <IGRPInputNumber
                        name={`dadosBancarios.${index}.nib`}
                        label={'NIB'}
                        min={0}
                        max={9999999}
                        required={false}
                        className={cn('col-span-1')}
                      />
                      <IGRPInputNumber
                        name={`dadosBancarios.${index}.numConta`}
                        label={'N Conta'}
                        min={0}
                        max={9999999}
                        required={true}
                        className={cn('col-span-1')}
                      />
                    </div>
                  </>
                )}
                computeLabel={(_: any, index: number) => `Item ${index}`}
                defaultItem={undefined}
              />

              <IGRPFormList
                id={'formlist_i0c7bj'}
                name={`anexos`}
                label={'Documentos'}
                description={'Documentos do contribuinte'}
                color={'primary'}
                variant={'solid'}
                addButtonLabel={'Add'}
                iconName={'FileText'}
                addButtonIconName={'Plus'}
                renderItem={(_: any, index: number) => (
                  <>
                    <div className='grid grid-cols-2 gap-4'>
                      <IGRPCombobox
                        name={`anexos.${index}.idTipoDocumento`}
                        label={'Tipo de Documento'}
                        className={cn('col-span-1')}
                        onChange={() => setSelectidTipoDocumentoValue}
                        value={selectidTipoDocumentoValue}
                        options={selectidTipoDocumentoOptions}
                      />
                      <IGRPInputFile
                        name={`anexos.${index}.inputFile1`}
                        label={'Input File'}
                        accept={'application/pdf'}
                        className={cn('col-span-1')}
                      />
                      <IGRPInputHidden
                        name={`anexos.${index}.url`}
                        label={'url'}
                        required={false}
                        className={cn('col-span-1')}
                      />
                    </div>
                  </>
                )}
                computeLabel={(_: any, index: number) => `Item ${index}`}
                defaultItem={undefined}
              />

              <div className={cn()}>
                <IGRPTextarea
                  name={`observacao`}
                  label={'Observaçōes'}
                  rows={3}
                  required={false}
                  placeholder='Digite aqui quaisquer observações relevantes sobre o contribuinte...'
                  className={cn()}
                />
              </div>
            </div>
          </>
        </IGRPForm>
        <IGRPButtonPrimitive
          onClick={() =>
            formRef.current?.handleSubmit((values) => console.log('Submit from button:', values))()
          }
        >
          Finish
        </IGRPButtonPrimitive>
      </div>
    );
  },
};

export const FormExamples2: StoryObj = {
  render: () => {
    const formContribuinte = z.object({  
      nomeResponsavel: z.string(),    
      dataInicioAtividade: z.date({
        message: 'Data de Início de Atividade é obrigatória',
      }),
    });

    const formRef = useRef<IGRPFormHandle<typeof formContribuinte>>(null);

    return (
      <div className='flex flex-col p-10 gap-6'>
        <IGRPForm
          schema={formContribuinte}
          validationMode='onBlur'
          onSubmit={(values) => {
            console.log('Advanced External Submit:', values);
            alert(`Form submitted successfully! Date: ${values.dataInicioAtividade.toLocaleDateString('pt-PT')}`);
          }}
          formRef={formRef}        
        >
          <div className='flex flex-col gap-6'>
            <IGRPCard
              name='identificacao'
              data-section-id={'identificacao'}
            >
              <IGRPCardHeader>
                <IGRPHeadline
                  name={`headline1`}
                  title={'Informações Básicas'}
                  description={'Dados principais do contribuinte'}
                  variant={'h5'}
                  showIcon={true}
                  iconName={'Building'}
                  className={cn(
                    'mt-3',
                    'flex flex-row flex-nowrap items-stretch justify-start gap-2',
                    'bg-[#FFFFFF] bg-cover bg-center bg-no-repeat bg-scroll mix-blend-normal',
                  )}
                />
              </IGRPCardHeader>
              <IGRPCardContent className='space-3 block'>
                <div className='grid grid-cols-2 gap-4'>
                  <IGRPInputText
                    id={`nomeResponsavel`}
                    label={'Nome do Responsável'}
                    disabled={false}
                    required={true}                    
                  />                  
                  <IGRPDatePickerInputSingle
                    placeholder='Selecione uma data...'                    
                    id="dataInicioAtividade"
                    label='Data de Início de Atividade'
                    disableBefore={new Date('1900-01-01')}
                    disableAfter={new Date('2099-12-31')}                    
                    dateFormat={`dd/MM/yyyy`}
                    required={true}
                  />
                </div>
              </IGRPCardContent>
            </IGRPCard>
          </div>
        </IGRPForm>
        <IGRPButtonPrimitive
          onClick={() => {
            formRef.current?.handleSubmit((values) => {
              console.log('Submit FORM 2 from button:', values);
            })();
          }}
        >
          Finish
        </IGRPButtonPrimitive>
      </div>
    );
  },
};
