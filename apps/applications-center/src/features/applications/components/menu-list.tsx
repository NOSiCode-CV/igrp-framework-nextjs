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
import { ListPlus } from 'lucide-react';
import { toast } from 'sonner';

import { z } from 'zod';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MenuDeleteDialog } from '@/features/applications/components/menu-delete-dialog';
import { MenuFormDialog } from '@/features/applications/components/menu-form-dialog';
import { SortableItem } from '@/features/applications/components/menu-sortable-item';

import { Application, MenuFormData } from '@/features/applications/types';
import {
  useAddMenu,
  useDeleteMenu,
  useMenusByApplication,
  useUpdateMenu,
} from '../hooks/use-menus';
import { createMenuSchema, normalizeMenuValues } from '../schemas/menu';

export function MenuList({ app }: { app: Application }) {
  const { id, code } = app;
  const { data: appMenus, isLoading, error: errorGetMenus } = useMenusByApplication(id);
  //const { mutate: changeOrder } = useUpdateMenuPosition()
  const { mutateAsync: createMenuAsync } = useAddMenu();
  const { mutate: updateMenu } = useUpdateMenu();
  const { mutateAsync: deleteMenuAsync } = useDeleteMenu();

  const [menus, setMenus] = useState<MenuFormData[]>([]);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<MenuFormData | undefined>(undefined);
  const [menuToDelete, setMenuToDelete] = useState<{ id: number; name: string } | null>(null);

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

  if (isLoading || !appMenus) return <div>Loading Menus...</div>;

  if (errorGetMenus) {
    return (
      <div className='rounded-md border py-6'>
        <p className='text-center'>Error Loading Menus</p>
        <p className='text-center'>{errorGetMenus.message}</p>
      </div>
    );
  }

  const handleEdit = (menu: MenuFormData) => {
    setSelectedMenu(menu);
    setEditDialogOpen(true);
  };

  const handleDelete = (id: number, name: string) => {
    setMenuToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!menuToDelete) return;

    try {
      await deleteMenuAsync(menuToDelete.id);

      toast.success('Menu deleted', {
        description: `The menu '${menuToDelete.name}' has been successfully deleted.`,
      });
    } catch (error) {
      toast.error('Delete failed', {
        description: (error as Error).message,
      });
    } finally {
      setDeleteDialogOpen(false);
      setMenuToDelete(null);
    }
  };

  const handleSaveMenu = async (values: z.infer<typeof createMenuSchema>, id?: number) => {
    values.applicationId = app.id;
    const normalized = normalizeMenuValues(values);

    if (id) {
      updateMenu({
        id,
        data: normalized,
      });

      setMenus((prevMenus) =>
        prevMenus.map((menu) =>
          menu.id === id ? ({ ...menu, ...normalized } as MenuFormData) : menu,
        ),
      );

      toast.success('Menu updated', {
        description: 'The menu has been successfully updated.',
      });
    } else {
      try {
        const newMenu = await createMenuAsync(normalized);
        setMenus((prev) => [...prev, newMenu]);

        toast.success('Menu created', {
          description: 'The menu has been successfully created.',
        });
      } catch (err) {
        toast.error('Menu creation failed', {
          description: (err as Error).message,
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

    if (activeItem.parentId !== overItem.parentId) {
      toast.warning('Invalid reorder', {
        description: 'You cannot move items across different parents.',
      });
      return;
    }

    const newMenus = arrayMove(menus, oldIndex, newIndex);
    setMenus(newMenus);

    try {
      // updateIndex(activeItem.id as number, newIndex)
      // toast.success('Menu order updated', {
      //   description: 'The menu order has been successfully updated.',
      // })
    } catch (error) {
      setMenus(menus);
      toast.error('Error updating menu order', {
        description: (error as Error).message,
      });
    }
  };

  // const updateIndex = (menuId: number, position: number) => {
  //   changeOrder({ id: menuId, position })
  // }

  const allMenuIds = menus.map((menu) => menu.id as number);
  const folderMenus = menus.filter((menu) => !menu.parentId && menu.type === 'FOLDER');

  return (
    <>
      <Card className='overflow-hidden card-hover gap-3'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Application Menus</CardTitle>
              <CardDescription>Manage and reorder menus for this application.</CardDescription>
            </div>
            <div className='flex justify-end mb-4'>
              <Button
                onClick={() => {
                  setSelectedMenu(undefined);
                  setNewMenuDialogOpen(true);
                }}
              >
                <ListPlus
                  className='mr-1'
                  strokeWidth={2}
                />{' '}
                New Menu
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='rounded-md border'>
            {menus.length === 0 ? (
              <p className='text-center py-6'>No menus found for this application.</p>
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
                    if (menu.parentId) return null;
                    const childMenus = menus.filter((m) => m.parentId === menu.id);

                    return (
                      <SortableItem
                        key={menu.id}
                        menuId={menu.id}
                        menu={menu}
                        code={code}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        subMenus={childMenus}
                      />
                    );
                  })}
                </SortableContext>
              </DndContext>
            )}
          </div>
        </CardContent>
      </Card>

      <MenuFormDialog
        open={editDialogOpen || newMenuDialogOpen}
        onOpenChange={(open) => {
          if (editDialogOpen) setEditDialogOpen(open);
          if (newMenuDialogOpen) setNewMenuDialogOpen(open);
        }}
        menu={selectedMenu}
        onSave={handleSaveMenu}
        parentMenus={folderMenus}
        applicationId={app.id}
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
