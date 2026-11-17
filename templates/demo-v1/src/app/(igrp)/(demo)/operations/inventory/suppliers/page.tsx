// Permission: open to all authenticated users — demo page with no sensitive data.
// Reached via the `OPS_SUPPLIERS` menu item (pageSlug: "operations/inventory/suppliers").
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Fornecedores" };

export default function OperationsSuppliersPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-foreground">Fornecedores</h1>
      <p className="mt-2 text-muted-foreground">
        Página de teste do menu <code>OPS_SUPPLIERS</code> (slug:{" "}
        <code>operations/inventory/suppliers</code>).
      </p>
    </div>
  );
}
