/**
 * CRUD page example using IGRP Design System.
 * Combines list (IGRPDataTable) with form actions.
 * Copy into your app or use as reference.
 */
'use client';

import { useRef } from 'react';
import {
  IGRPPageHeader,
  IGRPDataTable,
  IGRPButton,
  IGRPModalDialog,
  IGRPModalDialogTrigger,
  IGRPModalDialogContent,
  IGRPModalDialogHeader,
  IGRPModalDialogTitle,
  IGRPModalDialogFooter,
  IGRPForm,
  IGRPFormField,
  IGRPInputText,
  type ColumnDef,
} from '@igrp/igrp-framework-react-design-system';
import { z } from 'zod';

type Item = {
  id: string;
  name: string;
  description: string;
};

const itemSchema = z.object({
  name: z.string().min(1, 'Required'),
  description: z.string().optional(),
});

const columns: ColumnDef<Item>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'description', header: 'Description' },
];

const sampleData: Item[] = [
  { id: '1', name: 'Item 1', description: 'First item' },
  { id: '2', name: 'Item 2', description: 'Second item' },
];

export function CrudPageExample() {
  const formRef = useRef(null);

  const handleCreate = (values: z.infer<typeof itemSchema>) => {
    console.log('Create:', values);
  };

  return (
    <div>
      <IGRPPageHeader title="Items">
        <IGRPModalDialog>
          <IGRPModalDialogTrigger asChild>
            <IGRPButton>Create</IGRPButton>
          </IGRPModalDialogTrigger>
          <IGRPModalDialogContent>
            <IGRPModalDialogHeader>
              <IGRPModalDialogTitle>Create Item</IGRPModalDialogTitle>
            </IGRPModalDialogHeader>
            <IGRPForm schema={itemSchema} onSubmit={handleCreate} formRef={formRef}>
              <IGRPFormField name="name" label="Name" required>
                <IGRPInputText name="name" />
              </IGRPFormField>
              <IGRPFormField name="description" label="Description">
                <IGRPInputText name="description" />
              </IGRPFormField>
              <IGRPModalDialogFooter>
                <IGRPButton type="submit">Save</IGRPButton>
              </IGRPModalDialogFooter>
            </IGRPForm>
          </IGRPModalDialogContent>
        </IGRPModalDialog>
      </IGRPPageHeader>
      <IGRPDataTable columns={columns} data={sampleData} />
    </div>
  );
}
