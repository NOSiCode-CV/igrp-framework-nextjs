// Permission: open to all authenticated users — demo page with no sensitive data.
// Reached via the `REPORTS` menu item (url: "/reports").
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Relatórios" };

export default function ReportsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
      <p className="mt-2 text-muted-foreground">
        Página de teste do menu <code>REPORTS</code> (url: <code>/reports</code>
        ).
      </p>
    </div>
  );
}
