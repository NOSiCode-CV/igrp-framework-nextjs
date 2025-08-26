'use client';

import { useState } from 'react';
import {
  IGRPDialogPrimitive,
  IGRPDialogContentPrimitive,
  IGRPDialogDescriptionPrimitive,
  IGRPDialogFooterPrimitive,
  IGRPDialogHeaderPrimitive,
  IGRPDialogTitlePrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import { IGRPInputPrimitive } from '@igrp/igrp-framework-react-design-system';
import { IGRPLabelPrimitive } from '@igrp/igrp-framework-react-design-system';

interface MenuDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuName: string;
  onDelete: () => void;
}

export function MenuDeleteDialog({
  open,
  onOpenChange,
  menuName,
  onDelete,
}: MenuDeleteDialogProps) {
  const [confirmation, setConfirmation] = useState('');
  const isConfirmed = confirmation === menuName;

  return (
    <IGRPDialogPrimitive
      open={open}
      onOpenChange={onOpenChange}
    >
      <IGRPDialogContentPrimitive>
        <IGRPDialogHeaderPrimitive>
          <IGRPDialogTitlePrimitive>Delete Menu</IGRPDialogTitlePrimitive>
          <IGRPDialogDescriptionPrimitive>
            This action cannot be undone. This will permanently delete the menu and all its data.
          </IGRPDialogDescriptionPrimitive>
        </IGRPDialogHeaderPrimitive>
        <div className='space-y-4 py-2'>
          <p>
            To confirm, type <span className='font-medium'>{menuName}</span> below:
          </p>
          <div className='space-y-2'>
            <IGRPLabelPrimitive htmlFor='confirmation'>Confirmation</IGRPLabelPrimitive>
            <IGRPInputPrimitive
              id='confirmation'
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder={`Type '${menuName}' to confirm`}
              className='w-full'
            />
          </div>
        </div>
        <IGRPDialogFooterPrimitive>
          <IGRPButtonPrimitive
            variant='outline'
            onClick={() => onOpenChange(false)}
            type='button'
          >
            Cancel
          </IGRPButtonPrimitive>
          <IGRPButtonPrimitive
            variant='destructive'
            onClick={onDelete}
            disabled={!isConfirmed}
          >
            Delete
          </IGRPButtonPrimitive>
        </IGRPDialogFooterPrimitive>
      </IGRPDialogContentPrimitive>
    </IGRPDialogPrimitive>
  );
}
