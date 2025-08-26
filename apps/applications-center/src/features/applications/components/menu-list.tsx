'use client';

import { useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { z } from 'zod';
import { 
  IGRPButtonPrimitive,
  IGRPCardPrimitive, 
  IGRPCardContentPrimitive, 
  IGRPCardDescriptionPrimitive, 
  IGRPCardHeaderPrimitive, 
  IGRPCardTitlePrimitive,
  useIGRPToast,
  IGRPIcon
} from '@igrp/igrp-framework-react-design-system';
import { IGRPMenuItemArgs, IGRPApplicationArgs } from '@igrp/framework-next-types';

import { AppCenterLoading } from '@/components/loading';
import { MenuDeleteDialog } from '@/features/applications/components/menu-delete-dialog';
import { MenuFormDialog } from '@/features/applications/components/menu-form-dialog';
import { SortableItem } from '@/features/applications/components/menu-sortable-item';

import {
  // useAddMenu,
  // useDeleteMenu,
  useMenus,
  // useUpdateMenu,
  // useUpdateMenuPosition,
} from '../hooks/use-menus';
import { createMenuSchema, normalizeMenuValues } from '../schemas/menu';

export function MenuList({ app }: { app: IGRPApplicationArgs }) {
  const { igrpToast } = useIGRPToast();

  const { code } = app;
  const { data: appMenus, isLoading, error: errorGetMenus } = useMenus({ applicationCode: code });
  // const { mutate: changeOrder } = useUpdateMenuPosition()
  //const { mutateAsync: createMenuAsync } = useAddMenu();
  //const { mutate: updateMenu } = useUpdateMenu();
  //const { mutateAsync: deleteMenuAsync } = useDeleteMenu();

  const [menus, setMenus] = useState<IGRPMenuItemArgs[]>([]);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<IGRPMenuItemArgs | undefined>(undefined);
  const [menuToDelete, setMenuToDelete] = useState<{ code: string; name: string } | null>(null);

  const [newMenuDialogOpen, setNewMenuDialogOpen] = useState(false);

  useEffect(() => {
    if (appMenus) {
      setMenus(appMenus);
    }
  }, [appMenus]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  if (isLoading) return <AppCenterLoading descrption='A carregar menus...' />

  if (errorGetMenus) {
    return (
      <div className='rounded-md border py-6'>
        <p className='text-center'>Ocorreu um erro ao carregar menus.</p>
        <p className='text-center'>{errorGetMenus.message}</p>
      </div>
    );
  }

  const handleEdit = (menu: IGRPMenuItemArgs) => {
    setSelectedMenu(menu);
    setEditDialogOpen(true);
  };

  const handleDelete = (code: string, name: string) => {
    setMenuToDelete({ code, name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!menuToDelete) return;

    try {
      // await deleteMenuAsync(menuToDelete.code);

      igrpToast({
        type: 'success',
        title: 'Menu Eliminado',
        description: `O menu '${menuToDelete.name}' foi eliminado com sucesso.`,
      });
    } catch (error) {
       igrpToast({
        type: 'error',
        title: 'Erro ao eliminar.', 
        description: (error as Error).message,
      });
    } finally {
      setDeleteDialogOpen(false);
      setMenuToDelete(null);
    }
  };

  const handleSaveMenu = async (values: z.infer<typeof createMenuSchema>, code?: string) => {
    values.applicationCode = app.code;
    const normalized = normalizeMenuValues(values);

    if (code) {
      // updateMenu({
      //   code,
      //   data: normalized,
      // });

      setMenus((prevMenus) =>
        prevMenus.map((menu) =>
          menu.code === code ? ({ ...menu, ...normalized } as IGRPMenuItemArgs) : menu,
        ),
      );

      igrpToast({
        type: 'success',
        title: 'Menu Atualizado',
        description: 'O menu foi atualizado com sucesso.',
        duration: 3500
      });
    } else {
      try {
        // const newMenu = await createMenuAsync(normalized);
        // setMenus((prev) => [...prev, newMenu]);

        igrpToast({ 
          type: 'success',
          title: 'Criação de Menu',
          description: 'Menu criado com sucesso.',
          duration: 3500
        })
      } catch (err) {
        igrpToast({ 
          type: 'error',
          title: 'Falha na criação de menu.',
          description: (err as Error).message,
          duration: 3500
        });
      }
    }
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;

    if (!over || active.id === over.id) return;

    const oldIndex = menus.findIndex((item) => item.id === active.id);
    const newIndex = menus.findIndex((item) => item.id === over.id);

    const activeItem = menus[oldIndex];
    const overItem = menus[newIndex];

    if (!activeItem || !overItem) return;

    if (activeItem.parentCode !== overItem.parentCode) {
      igrpToast({
        type: 'warning',
        title:'Ordenação invalida',
        description: 'Não pode mover itens entre diferentes grupos.',
        duration: 3500
      });
      return;
    }

    const newMenus = arrayMove(menus, oldIndex, newIndex);
    setMenus(newMenus);

    try {
      // updateIndex(activeItem.id as number, newIndex)
      igrpToast({
        type: "success",
        title: "Ordem de menu atualizada",
        description: "The menu order has been successfully updated.",
        duration: 3500
      })
    } catch (error) {
      setMenus(menus);
      igrpToast({
        type: "error",
        title: "Error updating menu order",
        description: (error as Error).message
      })
    }
  };

  // const updateIndex = (menuId: number, position: number) => {
  //   changeOrder({ id: menuId, position })
  // }

  const allMenuIds = menus.map((menu) => menu.id as number);
  const folderMenus = menus.filter((menu) => !menu.parentCode && menu.type === 'FOLDER');
  const menuEmpty = menus.length === 0

  return (
    <>
      <IGRPCardPrimitive className='overflow-hidden card-hover gap-3 py-6'>
        <IGRPCardHeaderPrimitive>
          <div className='flex items-center justify-between'>
            <div>
              <IGRPCardTitlePrimitive>Menus da Aplicação</IGRPCardTitlePrimitive>
              <IGRPCardDescriptionPrimitive>
                Gerir e reorganizar os menus desta aplicação.
              </IGRPCardDescriptionPrimitive>
            </div>
            {!menuEmpty && (
              <div className='flex justify-end'>
                <IGRPButtonPrimitive
                  onClick={() => {
                    setSelectedMenu(undefined);
                    setNewMenuDialogOpen(true);
                  }}
                >
                  <IGRPIcon 
                    iconName='ListPlus'
                    className='mr-1'
                    strokeWidth={2}
                  />
                  Novo Menu
                </IGRPButtonPrimitive>
              </div>
            )}
          </div>
        </IGRPCardHeaderPrimitive>
        <IGRPCardContentPrimitive>
          <div className='rounded-md border'>
            {menuEmpty ? (
              <div className='text-center py-6'>
                <p className='mb-0'>
                  <span>Nenhum menu encontrado para esta aplicação.</span>                  
                </p>   
                <IGRPButtonPrimitive
                  onClick={() => {
                    setSelectedMenu(undefined);
                    setNewMenuDialogOpen(true);
                  }}
                  variant='link'
                  className='hover:underline-offset-4 underline'
                >                
                  Crie um novo menu.
                </IGRPButtonPrimitive>
              </div>
                         
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis]}
              >
                <SortableContext
                  items={allMenuIds}
                  strategy={verticalListSortingStrategy}
                >
                  {menus.map((menu) => {
                    if (menu.parentCode) return null;
                    const childMenus = menus.filter((m) => m.parentCode === menu.code);

                    return (
                      <SortableItem
                        key={menu.id}
                        menuId={menu.id}
                        menu={menu}
                        code={code}
                        onEdit={handleEdit}
                        // onDelete={handleDelete}
                        subMenus={childMenus}
                      />
                    );
                  })}
                </SortableContext>
              </DndContext>
            )}
          </div>
        </IGRPCardContentPrimitive>
      </IGRPCardPrimitive>

      <MenuFormDialog
        open={editDialogOpen || newMenuDialogOpen}
        onOpenChange={(open) => {
          if (editDialogOpen) setEditDialogOpen(open);
          if (newMenuDialogOpen) setNewMenuDialogOpen(open);
        }}
        menu={selectedMenu}
        // onSave={handleSaveMenu}
        parentMenus={folderMenus}
        appCode={app.code}
      />

      {menuToDelete && (
        <MenuDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          menuName={menuToDelete.name}
          onDelete={confirmDelete}
        />
      )}
    </>
  );
}
