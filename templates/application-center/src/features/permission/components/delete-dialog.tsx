'use client';

import { useState } from 'react';
import { IGRPDialogPrimitive,  IGRPDialogContentPrimitive, IGRPDialogDescriptionPrimitive, IGRPDialogFooterPrimitive, IGRPDialogHeaderPrimitive, IGRPDialogTitlePrimitive } from '@igrp/igrp-framework-react-design-system';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import { IGRPInputPrimitive  } from '@igrp/igrp-framework-react-design-system';
import { IGRPLabelPrimitive} from '@igrp/igrp-framework-react-design-system'

interface PermissionDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissionName: string;
  onDelete: () => void;
}

export function PermissionDeleteDialog({
  open,
  onOpenChange,
  permissionName,
  onDelete,
}: PermissionDeleteDialogProps) {
  const [confirmation, setConfirmation] = useState('');
  const isConfirmed = confirmation === permissionName;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Permission</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the permission and all its
            data.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-2'>
          <p>
            To confirm, type <span className='font-bold'>{permissionName}</span> below:
          </p>
          <div className='space-y-2'>
            <Label htmlFor='confirmation'>Confirmation</Label>
            <Input
              id='confirmation'
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder={`Type '${permissionName}' to confirm`}
              className='w-full'
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            type='button'
          >
            Cancel
          </Button>
          <Button
            variant='destructive'
            onClick={onDelete}
            disabled={!isConfirmed}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
