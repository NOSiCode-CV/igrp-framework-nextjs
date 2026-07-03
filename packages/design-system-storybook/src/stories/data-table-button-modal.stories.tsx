import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import {
  IGRPDataTableButtonModal,
  IGRPForm,
  IGRPInputText,
  Button,
} from '@igrp/igrp-framework-react-design-system';
import { z } from 'zod';

const meta: Meta<typeof IGRPDataTableButtonModal> = {
  title: 'Components/DataTable/ButtonModal',
  component: IGRPDataTableButtonModal,
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<typeof IGRPDataTableButtonModal>;

const schema = z.object({ name: z.string().min(1) });

/** A full form inside the modal — the canonical real-world body. */
export const WithFormBody: Story = {
  args: {
    labelTrigger: 'Edit',
    modalTitle: 'Editar utilizador',
    icon: 'Pencil',
    render: () => (
      <IGRPForm schema={schema} defaultValues={{ name: '' }} onSubmit={() => {}} className="px-6 py-4">
        <IGRPInputText name="name" label="Nome" />
      </IGRPForm>
    ),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('open the modal', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Edit' }));
    });
    // Radix portals the dialog to document.body, not canvasElement.
    const dialog = await waitFor(() => {
      const el = document.querySelector<HTMLElement>('[role="dialog"]');
      if (!el) throw new Error('dialog not open');
      return el;
    });

    // The aria-describedby target must be present AND must NOT be the form body.
    const describedById = dialog.getAttribute('aria-describedby');
    expect(describedById).toBeTruthy();
    const desc = document.getElementById(describedById!);
    expect(desc).not.toBeNull();
    // The description element must not contain the form field (i.e. it is the
    // short fallback string, not the whole render() subtree).
    expect(desc?.querySelector('input')).toBeNull();

    // The form actually rendered inside the dialog body.
    const body = dialog.querySelector('[data-slot="dialog-body"]');
    expect(body).not.toBeNull();
    expect(body?.querySelector('input')).not.toBeNull();
  },
};

/** A fragment / multi-root body — threw React.Children.only under `asChild`. */
export const WithFragmentBody: Story = {
  args: {
    labelTrigger: 'Details',
    modalTitle: 'Detalhes',
    icon: 'Info',
    render: () => (
      <>
        <p className="px-6 pt-4">First paragraph.</p>
        <p className="px-6">Second paragraph.</p>
      </>
    ),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('open a modal whose body is a fragment', async () => {
      // Before the fix, Slot's React.Children.only throws during render here.
      await userEvent.click(canvas.getByRole('button', { name: 'Details' }));
    });
    const dialog = await waitFor(() => {
      const el = document.querySelector<HTMLElement>('[role="dialog"]');
      if (!el) throw new Error('dialog not open');
      return el;
    });
    const body = dialog.querySelector('[data-slot="dialog-body"]');
    expect(body).not.toBeNull();
    expect(body?.querySelectorAll('p')).toHaveLength(2);
  },
};
