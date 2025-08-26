import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  IGRPButtonPrimitive,
  IGRPBadgePrimitive,
  IGRPDropdownMenuPrimitive,
  IGRPDropdownMenuContentPrimitive,
  IGRPDropdownMenuItemPrimitive,
  IGRPDropdownMenuSeparatorPrimitive,
  IGRPDropdownMenuTriggerPrimitive,
  IGRPIcon,
} from '@igrp/igrp-framework-react-design-system';

import { cn } from '@/lib/utils';
import { IGRPMenuItemArgs } from '@igrp/framework-next-types';

interface SortableItemProps {
  menuId: number | undefined;
  menu: IGRPMenuItemArgs;
  code: string;
  onEdit: (menu: IGRPMenuItemArgs) => void;
  onDelete?: (id: number, name: string) => void;
  depth?: number;
  isChild?: boolean;
  subMenus?: IGRPMenuItemArgs[];
}

export function SortableItem({
  menuId,
  menu,
  code,
  onEdit,
  onDelete,
  depth = 0,
  isChild = false,
  subMenus,
}: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: menuId as number,
    data: {
      type: 'menu-item',
      parent: menu.parentCode,
      isChild,
    },
  });
  const [isExpanded, setIsExpanded] = useState(true);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'flex items-center justify-between p-3 border-b last:border-0',
          isChild && 'pl-6 bg-muted/20',
        )}
        data-parent={menu.parentCode}
      >
        <div className='flex items-center gap-2'>
          {!isChild && (
            <IGRPButtonPrimitive
              variant='ghost'
              size='icon'
              className={cn('h-6 w-6 p-0 invisible', subMenus && subMenus.length > 0 && 'visible')}
              onClick={
                subMenus && subMenus.length > 0 ? () => setIsExpanded(!isExpanded) : undefined
              }
            >
              <IGRPIcon iconName={isExpanded ? 'ChevronDown' : 'ChevronRight'} strokeWidth={2} />
            </IGRPButtonPrimitive>
          )}

          <IGRPButtonPrimitive
            {...attributes}
            {...listeners}
            className='cursor-grab active:cursor-grabbing p-1 rounded-md hover:bg-muted'
            variant='ghost'
            size='icon'
          >
            <IGRPIcon 
              iconName='GripVertical'
              className='size-4 text-primary'
              strokeWidth={2}
            />
          </IGRPButtonPrimitive>

          <div>
            <div className='font-medium'>{menu.name}</div>
            <div className='text-sm text-muted-foreground'>{menu.icon}</div>
          </div>
        </div>

        <div className='flex items-center gap-4'>
          <IGRPBadgePrimitive
            variant='secondary'
            className={
              menu.type === 'FOLDER'
                ? 'text-secondary bg-secondary-foreground'
                : 'text-muted bg-muted-foreground'
            }
          >
            {menu.type}
          </IGRPBadgePrimitive>
          <IGRPDropdownMenuPrimitive>
            <IGRPDropdownMenuTriggerPrimitive asChild>
              <IGRPButtonPrimitive
                variant='ghost'
                className='h-7 w-7 p-0'
              >
                <span className='sr-only'>Open menu</span>
                <IGRPIcon iconName='MoreHorizontal' strokeWidth={2} />
              </IGRPButtonPrimitive>
            </IGRPDropdownMenuTriggerPrimitive>
            <IGRPDropdownMenuContentPrimitive align='end'>
              <IGRPDropdownMenuItemPrimitive
                onClick={() => onEdit(menu)}
                className='cursor-pointer'
              >
                <IGRPIcon 
                  iconName='Edit'
                  className='mr-1 h-4 w-4'
                  strokeWidth={2}
                />
                Editar
              </IGRPDropdownMenuItemPrimitive>
              <IGRPDropdownMenuSeparatorPrimitive />
              <IGRPDropdownMenuItemPrimitive
                className='text-destructive focus:text-destructive cursor-pointer bg-destructive/10'
                onClick={() => onDelete(menu.id as number, menu.name)}
              >
                <IGRPIcon 
                  iconName='Trash'
                  className='mr-1 h-4 w-4 text-destructive'
                  strokeWidth={2}
                />
                Eliminar
              </IGRPDropdownMenuItemPrimitive>
            </IGRPDropdownMenuContentPrimitive>
          </IGRPDropdownMenuPrimitive>
        </div>
      </div>
      {isExpanded && subMenus && subMenus.length > 0 && (
        <div className='border-l-2 ml-8 pl-2'>
          {subMenus.map((child) => (
            <SortableItem
              key={child.id}
              menuId={child.id}
              menu={child}
              code={code}
              onEdit={onEdit}
              onDelete={onDelete}
              depth={depth + 1}
              isChild={true}
            />
          ))}
        </div>
      )}
    </>
  );
}
