// Reached via the `DASHBOARD` menu item (pageSlug: "dashboard").
export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Test page for the <code>DASHBOARD</code> menu (slug:{" "}
        <code>dashboard</code>).
      </p>
    </div>
  );
}
