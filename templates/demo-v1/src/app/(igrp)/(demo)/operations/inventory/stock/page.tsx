// Permission: open to all authenticated users — demo page with no sensitive data.
// Reached via the `OPS_STOCK` menu item (pageSlug: "operations/inventory/stock").
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Stock" };

export default function OperationsStockPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-foreground">Stock</h1>
      <p className="mt-2 text-muted-foreground">
        Página de teste do menu <code>OPS_STOCK</code> (slug:{" "}
        <code>operations/inventory/stock</code>).
      </p>
    </div>
  );
}
