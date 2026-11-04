import z from 'zod';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  IGRPForm,
  IGRPInputText,
  IGRPMultiStepForm,
  IGRPMultiStepFormFooter,
  IGRPMultiStepFormHeader,
  IGRPMultiStepFormNext,
  IGRPMultiStepFormPrevious,
  IGRPMultiStepFormSteps,
  IGRPMultiStepFormSubmit,
  type IGRPMultiStepFormHeaderProps,
  type IGRPWizardStep,
} from '@igrp/igrp-framework-react-design-system';

const meta: Meta<typeof IGRPMultiStepForm> = {
  title: 'Horizon/MultiStepForm',
  component: IGRPMultiStepForm,
};
export default meta;

const schema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  city: z.string().min(1, 'Required'),
});

const steps: IGRPWizardStep[] = [
  {
    key: 'identity',
    title: 'Identidade',
    fields: ['name'],
    component: <IGRPInputText name='name' label='Nome' required />,
  },
  {
    key: 'contact',
    title: 'Contacto',
    fields: ['email'],
    component: <IGRPInputText name='email' label='Email' required />,
  },
  {
    key: 'address',
    title: 'Morada',
    fields: ['city'],
    component: <IGRPInputText name='city' label='Cidade' required />,
  },
];

const Wizard = ({
  header,
  wizardSteps = steps,
}: {
  header?: IGRPMultiStepFormHeaderProps;
  wizardSteps?: IGRPWizardStep[];
}) => (
  <div className='max-w-xl p-4'>
    <IGRPForm
      schema={schema}
      defaultValues={{ name: '', email: '', city: '' }}
      onSubmit={(data) => console.log('Submitted:', data)}
    >
      <IGRPMultiStepForm steps={wizardSteps}>
        <IGRPMultiStepFormHeader {...header} />
        <IGRPMultiStepFormSteps />
        <IGRPMultiStepFormFooter>
          <IGRPMultiStepFormPrevious />
          <IGRPMultiStepFormNext />
          <IGRPMultiStepFormSubmit />
        </IGRPMultiStepFormFooter>
      </IGRPMultiStepForm>
    </IGRPForm>
  </div>
);

export const Number: StoryObj = { render: () => <Wizard header={{ variant: 'number' }} /> };

export const Ring: StoryObj = { render: () => <Wizard /> };

export const Blocking: StoryObj = {
  render: () => (
    <Wizard
      header={{ navigable: true }}
      wizardSteps={[
        {
          ...steps[0],
          blockingMessage: (values) => (values.name ? null : 'Preencha o nome para continuar'),
        },
        ...steps.slice(1),
      ]}
    />
  ),
};
