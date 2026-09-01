// Reached via the `OPS_ORDERS` menu item (pageSlug: "operations/orders").
export default function OperationsOrdersPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
      <p className="mt-2 text-muted-foreground">
        Test page for the <code>OPS_ORDERS</code> menu (slug:{" "}
        <code>operations/orders</code>).
      </p>
    </div>
  );
}
