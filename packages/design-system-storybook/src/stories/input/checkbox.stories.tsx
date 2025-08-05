/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import { z } from 'zod';
import {
  IGRPCheckbox,
  type IGRPCheckboxProps,
  IGRPButtonPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// import { IGRPForm, IGRPFormHandle } from '../../form'
// import { IGRPCard, IGRPCardContent, IGRPCardFooter, IGRPCardHeader } from '../../card'
// import { IGRPPageHeader } from '../../page-header'
// import { IGRPBadge } from '../../badge'
// import { cn } from '@/lib/utils'
// import { IGRPCombobox } from '../combobox'
// import { IGRPInputText } from '../text'
// import { IGRPInputNumber } from '../number'
// import { IGRPDatePicker } from '../date-picker'
// import { IGRPInputPhone } from '../phone'
// import { useRef, useState } from 'react'
// import { IGRPOptionsProps } from '@/types/globals'

export default {
  title: 'Components/Input/Checkbox',
  component: IGRPCheckbox,
  // parameters: {
  //   layout: 'centered',
  // },
  argTypes: {
    label: { control: 'text' },
    helperText: { control: 'text' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    defaultChecked: { control: 'boolean' },
    IGRPGridSize: {
      control: 'select',
      options: ['full', '1/2', '1/3', '2/3', '1/4', '3/4'],
    },
    error: { control: 'text' },
  },
} as Meta;

const Template: StoryFn<IGRPCheckboxProps> = (args) => (
  <div className='container my-10 mx-auto p-4 border rounded-lg shadow-sm'>
    <IGRPCheckbox {...args} />
  </div>
);

const FormTemplate: StoryFn<IGRPCheckboxProps> = (args) => {
  const schema = z.object({
    [args.name]: z.boolean().refine((val) => val === true, {
      message: 'Você precisa aceitar os termos para continuar',
    }),
  });

  const form = useForm({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      [args.name]: args.defaultChecked || false,
    },
  });

  const onSubmit = (data: any) => {
    console.log('Formulário enviado:', data);
    alert(`Formulário enviado com sucesso: ${JSON.stringify(data)}`);
  };

  return (
    <div className='container my-10 mx-auto p-4 border rounded-lg shadow-sm max-w-md'>
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-4'
        >
          <IGRPCheckbox {...args} />

          <IGRPButtonPrimitive
            type='submit'
            className='mt-4'
          >
            Enviar
          </IGRPButtonPrimitive>
        </form>
      </FormProvider>
    </div>
  );
};

// Stories básicas
export const Default: StoryObj<IGRPCheckboxProps> = {
  render: Template,
  args: {
    name: 'agree',
    label: 'Eu concordo com os termos',
  },
};

export const WithHelperText: StoryObj<IGRPCheckboxProps> = {
  render: Template,
  args: {
    name: 'newsletter',
    label: 'Inscrever na newsletter',
    helperText: 'Receba atualizações semanais sobre nossos produtos',
  },
};

export const Required: StoryObj<IGRPCheckboxProps> = {
  render: Template,
  args: {
    name: 'requiredAgreement',
    label: 'Aceitar termos e condições',
    required: true,
  },
};

export const Checked: StoryObj<IGRPCheckboxProps> = {
  render: Template,
  args: {
    name: 'preChecked',
    label: 'Opção pré-selecionada',
    defaultChecked: true,
  },
};

export const Disabled: StoryObj<IGRPCheckboxProps> = {
  render: Template,
  args: {
    name: 'disabledOption',
    label: 'Opção desabilitada',
    disabled: true,
  },
};

export const WithError: StoryObj<IGRPCheckboxProps> = {
  render: Template,
  args: {
    name: 'errorCheckbox',
    label: 'Opção com erro',
    error: 'Este campo é obrigatório',
  },
};

// Story com formulário e validação
export const WithValidation: StoryObj<IGRPCheckboxProps> = {
  render: FormTemplate,
  args: {
    name: 'termsAndConditions',
    label: 'Eu li e aceito os termos e condições',
    required: true,
    helperText: 'Você precisa aceitar os termos para continuar',
  },
};

// export const EngineForm: StoryObj<IGRPCheckboxProps> = {
//   render: () => {
//     const [contentFormform1, setContentFormform1] = useState<z.infer<Form1ZodType>>()
//     const [selectcombobox5Options, setSelectcombobox5Options] = useState<IGRPOptionsProps[]>([]);
//     const [selectcombobox3Options, setSelectcombobox3Options] = useState<IGRPOptionsProps[]>([]);
//     const [selectcombobox4Options, setSelectcombobox4Options] = useState<IGRPOptionsProps[]>([]);
//     const [selectcombobox2Options, setSelectcombobox2Options] = useState<IGRPOptionsProps[]>([]);
//     const [selectcombobox1Options, setSelectcombobox1Options] = useState<IGRPOptionsProps[]>([]);

//     const form1 = z.object({
//       inputHidden1: z.string().optional(),
//       combobox5: z.string().optional(),
//       combobox3: z.string().optional(),
//       combobox4: z.string().optional(),
//       combobox2: z.string().optional(),
//       combobox1: z.string().optional(),
//       inputText1: z.string().optional(),
//       inputNumber1: z.string().optional(),
//       inputDatePicker1: z.date().optional(),
//       inputPhone1: z.string().optional(),
//     });

//     type Form1ZodType = typeof form1;

//     // eslint-disable-next-line react-hooks/rules-of-hooks
//     const formform1Ref = useRef<IGRPFormHandle<Form1ZodType> | null>(null);

//     const onSubmitForm = (data: z.infer<Form1ZodType>) => {
//       console.log('Formulário enviado:', data);
//       alert(`Formulário enviado com sucesso: ${JSON.stringify(data)}`);
//     };

//     return (
//       <IGRPForm
//         schema={form1}
//         validationMode="onBlur"
//         gridClassName="flex flex-col"
//         formRef={formform1Ref}
//         className={cn()}
//         onSubmit={onSubmitForm}
//         defaultValues={contentFormform1}
//       >
//         <>
//           <IGRPCard className={cn()}>
//             <IGRPCardHeader className={cn()}>
//               <IGRPPageHeader
//                 title="Informações Básicas"
//                 description="Dados principais do contribuinte"
//                 variant="h6"
//                 className={cn()}
//               >
//                 <div className="flex items-center gap-2">
//                   <IGRPBadge
//                     color="primary"
//                     variant="soft"
//                     size="md"
//                     iconName="Info"
//                     iconPlacement="start"
//                     className={cn()}
//                   >
//                     Obrigatório
//                   </IGRPBadge>
//                 </div>
//               </IGRPPageHeader>
//             </IGRPCardHeader>
//             <IGRPCardContent className={cn('space-x-3', 'space-y-3')}>
//               <div className='grid grid-cols-6 gap-4'>
//                 <IGRPCheckbox
//                   name="checkbox1"
//                   label="Check"
//                   gridSize='1/2'
//                 />
//                 <IGRPCombobox
//                   name="combobox5"
//                   placeholder="Select an option..."
//                   label="Combobox Input"
//                   selectLabel="No option found"
//                   value={undefined}
//                   options={selectcombobox5Options}
//                 />
//                 <IGRPCombobox
//                   name="combobox3"
//                   placeholder="Select an option..."
//                   label="Combobox Input"
//                   selectLabel="No option found"
//                   value={undefined}
//                   options={selectcombobox3Options}
//                 />
//                 <IGRPCombobox
//                   name="combobox4"
//                   placeholder="Select an option..."
//                   label="Combobox Input"
//                   selectLabel="No option found"
//                   value={undefined}
//                   options={selectcombobox4Options}
//                 />
//                 <IGRPCombobox
//                   name="combobox2"
//                   placeholder="Select an option..."
//                   label="Combobox Input"
//                   selectLabel="No option found"
//                   value={undefined}
//                   options={selectcombobox2Options}
//                 />
//                 <IGRPCombobox
//                   name="combobox1"
//                   placeholder="Select an option..."
//                   label="Combobox Input"
//                   selectLabel="No option found"
//                   value={undefined}
//                   options={selectcombobox1Options}
//                 />
//                 <IGRPInputText
//                   name="inputText1"
//                   placeholder=""
//                   label="Input Text"
//                 />
//                 <IGRPInputNumber
//                   name="inputNumber1"
//                   label="Input Number"
//                   max={9999999}
//                   step={1}
//                 />
//                 {/* <IGRPDatePicker
//                   name="inputDatePicker1"
//                   label="Date Picker"
//                   startDate={new Date('1900-01-01')}
//                   endDate={new Date('2099-12-31')}
//                   className={cn('col-span-1')}
//                 /> */}
//                 <IGRPInputPhone
//                   name="inputPhone1"
//                   dir="ltr"
//                   defaultCountry="CV"
//                   label="Input Phone"
//                   international={true}
//                 />
//               </div>
//             </IGRPCardContent>
//             <IGRPCardFooter className={cn()}></IGRPCardFooter>
//           </IGRPCard>
//         </>
//       </IGRPForm>
//     )
//   },
//   args: {
//     name: 'engineForm',
//     label: 'Eu li e aceito os termos e condições',
//     required: true,
//     helperText: 'vous devez accepter les termes et conditions pour continuer',
//   },
// };
