// Permission: open to all authenticated users. DEMO STUB ONLY — a real admin
// screen MUST add the server-side page guard on its first line; see
// docs/PERMISSIONS.md. There is no default-deny, so without that call the
// route is fully open and deep-linkable. (The guard function is deliberately
// not named here: auditing which pages are gated is a grep for the call, and
// a mention in a comment defeats it.)
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
