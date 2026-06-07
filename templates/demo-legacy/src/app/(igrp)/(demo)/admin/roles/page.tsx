// Reached via the `ADMIN_ROLES` menu item (pageSlug: "admin/roles").
export default function AdminRolesPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-foreground">
        Perfis &amp; Permissões
      </h1>
      <p className="mt-2 text-muted-foreground">
        Test page for the <code>ADMIN_ROLES</code> menu (slug:{" "}
        <code>admin/roles</code>).
      </p>
    </div>
  );
}
