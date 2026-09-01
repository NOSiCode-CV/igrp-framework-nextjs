// Reached via the `ADMIN_USERS` menu item (pageSlug: "admin/users").
export default function AdminUsersPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-foreground">Utilizadores</h1>
      <p className="mt-2 text-muted-foreground">
        Test page for the <code>ADMIN_USERS</code> menu (slug:{" "}
        <code>admin/users</code>).
      </p>
    </div>
  );
}
