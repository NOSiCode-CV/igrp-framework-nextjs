const mapApplication = (app) => ({
    id: app.id,
    code: app.code,
    name: app.name,
    description: app.description,
    status: app.status,
    type: app.type,
    owner: app.owner || undefined,
    picture: app.picture,
    url: app.url || null,
    slug: app.slug || undefined,
});
export const mapperApplications = (apps) => {
    if (!apps.data)
        return [];
    return apps.data.map(mapApplication);
};
