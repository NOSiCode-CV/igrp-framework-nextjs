import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  IGRPButton,
  IGRPForm,
  type IGRPFormHandle,
} from '@igrp/igrp-framework-react-design-system';
import {
  IGRPRichTextEditor,
  IGRPRichTextView,
} from '@igrp/igrp-framework-react-design-system/rich-text';
import z from 'zod';

const VARIABLES = [
  { value: '{{nome_titular}}', label: 'Nome do titular' },
  { value: '{{numero_processo}}', label: 'Nº do processo' },
  { value: '{{data_emissao}}', label: 'Data de emissão' },
];

const SAMPLE = [
  '<h2>Notificação de deferimento</h2>',
  '<p>Caro(a) <strong>{{nome_titular}}</strong>,</p>',
  '<p>Informamos que o processo <em>{{numero_processo}}</em> foi <mark>deferido</mark>.</p>',
  '<ul><li><p>Levante o alvará no balcão.</p></li><li><p>Traga o documento de identificação.</p></li></ul>',
  '<blockquote><p>Prazo de levantamento: 30 dias.</p></blockquote>',
  '<table><tbody><tr><th><p>Taxa</p></th><th><p>Valor</p></th></tr><tr><td><p>Emissão</p></td><td><p>1 500 CVE</p></td></tr></tbody></table>',
  '<p style="text-align: center"><span style="color: #1d4ed8">Mais informação em </span><a href="https://igrp.cv">igrp.cv</a></p>',
].join('');

export default {
  title: 'Components/Input/RichText',
  component: IGRPRichTextEditor,
  argTypes: {
    label: { control: 'text' },
    helperText: { control: 'text' },
    error: { control: 'text' },
    placeholder: { control: 'text' },
    required: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    disabled: { control: 'boolean' },
    preset: { control: 'inline-radio', options: ['full', 'email'] },
  },
} as Meta;

type Story = StoryObj<typeof IGRPRichTextEditor>;

/** Controlled: `value` + `onChange`, no form. The view renders what the editor writes. */
export const Controlled: Story = {
  args: {
    label: 'Corpo do documento',
    helperText: 'Use as variáveis para dados do processo.',
    preset: 'full',
  },
  render: (args) => {
    const [html, setHtml] = useState(SAMPLE);
    return (
      <div className='grid gap-6 lg:grid-cols-2'>
        <IGRPRichTextEditor
          {...args}
          value={html}
          onChange={setHtml}
          variables={VARIABLES}
        />
        <div className='rounded-lg border p-4'>
          <IGRPRichTextView html={html} />
        </div>
      </div>
    );
  },
};

/** Email preset: no controls whose output a strict e-mail allow-list strips. */
export const EmailPreset: Story = {
  args: { label: 'Corpo de email', preset: 'email' },
  render: (args) => {
    const [html, setHtml] = useState('<p>Caro(a) {{nome_titular}},</p>');
    return (
      <IGRPRichTextEditor
        {...args}
        value={html}
        onChange={setHtml}
        variables={VARIABLES}
      />
    );
  },
};

/** An explicit control list replaces the preset. */
export const ExplicitControls: Story = {
  render: () => {
    const [html, setHtml] = useState('<p>Só negrito, itálico e ligações.</p>');
    return (
      <IGRPRichTextEditor
        label='Observações'
        value={html}
        onChange={setHtml}
        controls={['bold', 'italic', 'link']}
      />
    );
  },
};

const schema = z.object({ corpo: z.string().min(1, 'O corpo é obrigatório') });

/** Form-bound inside IGRPForm: dirty tracking, touched on blur, Zod error under the field. */
export const FormBound: Story = {
  render: () => {
    const formRef = useRef<IGRPFormHandle<typeof schema> | null>(null);
    const [readOnly, setReadOnly] = useState(false);
    const [submitted, setSubmitted] = useState<string>();
    return (
      <IGRPForm
        schema={schema}
        formRef={formRef}
        defaultValues={{ corpo: '' }}
        onSubmit={(values) => setSubmitted(values.corpo)}
        validationMode='onTouched'
      >
        <div className='flex flex-col gap-4'>
          <IGRPRichTextEditor
            name='corpo'
            label='Corpo de email'
            required
            preset='email'
            readOnly={readOnly}
            variables={VARIABLES}
          />
          <div className='flex gap-2'>
            <IGRPButton type='submit'>Guardar</IGRPButton>
            <IGRPButton
              type='button'
              variant='outline'
              onClick={() => setReadOnly((v) => !v)}
            >
              {readOnly ? 'Editar' : 'Só leitura'}
            </IGRPButton>
          </div>
          {submitted !== undefined ? <IGRPRichTextView html={submitted} /> : null}
        </div>
      </IGRPForm>
    );
  },
};

/** The view drops everything the schema does not declare: script, iframe, img onerror, javascript: links. */
export const ViewAllowList: StoryObj<typeof IGRPRichTextView> = {
  render: () => (
    <IGRPRichTextView
      html={[
        '<p>Texto seguro.</p>',
        '<script>alert("xss")</script>',
        '<p><img src="x" onerror="alert(1)">imagem removida</p>',
        '<iframe src="https://example.com"></iframe>',
        '<p><a href="javascript:alert(1)">ligação neutralizada</a></p>',
      ].join('')}
    />
  ),
};

/** A long body clipped by `maxHeight`, with "Ver mais" / "Ver menos". */
export const ViewMaxHeight: StoryObj<typeof IGRPRichTextView> = {
  render: () => (
    <IGRPRichTextView
      html={SAMPLE + SAMPLE}
      maxHeight={160}
      className='max-w-xl'
    />
  ),
};

/** A blank body renders the empty label and never mounts an editor. */
export const ViewEmpty: StoryObj<typeof IGRPRichTextView> = {
  render: () => <IGRPRichTextView html='<p></p>' />,
};
