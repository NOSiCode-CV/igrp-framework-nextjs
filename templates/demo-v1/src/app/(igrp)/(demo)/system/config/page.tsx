// Reached via the `SYS_CONFIG` menu item (pageSlug: "system/config").
// The menu item carries a `roles` entry, but that is metadata only — nothing
// filters menus on it (see src/temp/menus/menus.ts).
//
// This page is open to all authenticated users: it is a demo with no sensitive
// content. A real settings page adds the server-side page guard on its first
// line — see docs/PERMISSIONS.md. (Deliberately not naming the guard function
// here: auditing which pages are gated is a grep for the call, and a mention in
// prose would show up as a false positive.)
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
