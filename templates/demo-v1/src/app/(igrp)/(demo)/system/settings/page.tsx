// Permission: open to all authenticated users. DEMO STUB ONLY — a real admin
// screen MUST add the server-side page guard on its first line; see
// docs/PERMISSIONS.md. There is no default-deny, so without that call the
// route is fully open and deep-linkable. (The guard function is deliberately
// not named here: auditing which pages are gated is a grep for the call, and
// a mention in a comment defeats it.)
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
