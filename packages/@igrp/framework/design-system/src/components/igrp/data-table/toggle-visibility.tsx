import { type Table } from '@tanstack/react-table';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/primitives/dropdown-menu';
import { IGRPButton } from '@/components/igrp/button';

type IGPRDataTableVisibilityProps<TData> = {
  table: Table<TData>;
  label?: string;
  optionsLabel?: string;
};

function IGPRDataTableToggleVisibility<TData>({
  table,
  label = 'View',
  optionsLabel = 'Toggle columns',
}: IGPRDataTableVisibilityProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IGRPButton
          variant='outline'
          showIcon={true}
          iconName='Columns3'
        >
          {label}
        </IGRPButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start'>
        <DropdownMenuLabel>{optionsLabel}</DropdownMenuLabel>
        {table
          .getAllColumns()
          .filter((column) => column.getCanHide())
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className='capitalize'
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
                onSelect={(e) => e.preventDefault()}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { IGPRDataTableToggleVisibility, type IGPRDataTableVisibilityProps };
