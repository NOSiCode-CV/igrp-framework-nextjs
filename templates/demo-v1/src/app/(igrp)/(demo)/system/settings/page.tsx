// Reached via the `SYS_SETTINGS` menu item (type: SYSTEM_PAGE, pageSlug: "system/settings").
export default function SystemSettingsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-foreground">
        Definições do Sistema
      </h1>
      <p className="mt-2 text-muted-foreground">
        Test page for the <code>SYS_SETTINGS</code> menu (slug:{" "}
        <code>system/settings</code>).
      </p>
    </div>
  );
}
