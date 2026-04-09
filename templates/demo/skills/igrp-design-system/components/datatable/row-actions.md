# IGRPDataTable Row Actions

## Import

```tsx
import {
  IGRPDataTableRowAction,
  IGRPDataTableButtonLink,
  IGRPDataTableButtonModal,
  IGRPDataTableButtonAlert,
  IGRPDataTableDropdownMenu,
  IGRPDataTableDropdownMenuLink,
  IGRPDataTableDropdownMenuAlert,
} from '@igrp/igrp-framework-react-design-system';
```

## Action Buttons

- `IGRPDataTableButtonLink` – Link to detail/edit
- `IGRPDataTableButtonModal` – Open modal
- `IGRPDataTableButtonAlert` – Confirm dialog

## Dropdown Menu

- `IGRPDataTableDropdownMenu` – Container
- `IGRPDataTableDropdownMenuLink` – Link item
- `IGRPDataTableDropdownMenuAlert` – Delete with confirm

## Example

```tsx
{
  id: 'actions',
  header: '',
  cell: ({ row }) => (
    <IGRPDataTableRowAction>
      <IGRPDataTableDropdownMenu
        trigger={<IGRPButton size="icon-sm" iconName="MoreHorizontal" />}
        items={[
          { type: 'link', label: 'Edit', href: `/users/${row.original.id}/edit` },
          { type: 'alert', label: 'Delete', onConfirm: () => deleteUser(row.original.id) },
        ]}
      />
    </IGRPDataTableRowAction>
  ),
}
```
