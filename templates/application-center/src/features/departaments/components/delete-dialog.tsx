'use client';

import { useState } from 'react';
import { IGRPDialogPrimitive,  IGRPDialogContentPrimitive, IGRPDialogDescriptionPrimitive, IGRPDialogFooterPrimitive, IGRPDialogHeaderPrimitive, IGRPDialogTitlePrimitive } from '@igrp/igrp-framework-react-design-system';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import { IGRPInputPrimitive  } from '@igrp/igrp-framework-react-design-system';
import { IGRPLabelPrimitive} from '@igrp/igrp-framework-react-design-system'

interface DepartmentDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departmentName: string;
  onDelete: () => void;
}

export function DepartmentDeleteDialog({
  open,
  onOpenChange,
  departmentName,
  onDelete,
}: DepartmentDeleteDialogProps) {
  const [confirmation, setConfirmation] = useState('');
  const isConfirmed = confirmation === departmentName;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Department</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the department and all its
            data.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-2'>
          <p>
            To confirm, type <span className=' font-bold'>{departmentName}</span> below:
          </p>
          <div className='space-y-2'>
            <Label htmlFor='confirmation'>Confirmation</Label>
            <Input
              id='confirmation'
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder={`Type '${departmentName}' to confirm`}
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
