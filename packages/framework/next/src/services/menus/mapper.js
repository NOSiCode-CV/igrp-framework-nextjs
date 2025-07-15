const mapMenu = (menu) => ({
    id: menu.id,
    name: menu.name,
    type: menu.type,
    position: menu.position || null,
    icon: menu.icon || undefined,
    status: menu.status,
    target: menu.target,
    url: menu.url || null,
    parentId: menu.parentId || null,
    applicationId: menu.applicationId,
    resourceId: menu.resourceId || null,
});
export const mapperMenus = (menus) => {
    if (!menus.data)
        return [];
    return menus.data.map(mapMenu);
};
