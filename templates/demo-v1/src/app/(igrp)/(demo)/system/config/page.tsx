// Reached via the `SYS_CONFIG` menu item (role-gated, pageSlug: "system/config").
export default function SystemConfigPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-foreground">
        Configuração Avançada
      </h1>
      <p className="mt-2 text-muted-foreground">
        Test page for the <code>SYS_CONFIG</code> menu (slug:{" "}
        <code>system/config</code>).
      </p>
    </div>
  );
}
