// Permission: open to all authenticated users — demo page with no sensitive data.
// Reached via the `DASHBOARD` menu item (pageSlug: "dashboard").
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Página de teste do menu <code>DASHBOARD</code> (slug:{" "}
        <code>dashboard</code>).
      </p>
    </div>
  );
}
