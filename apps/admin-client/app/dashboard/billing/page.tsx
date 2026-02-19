export default function BillingPage() {
  return (
    <main className="p-6 space-y-6" data-testid="billing-page">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Billing</h1>
          <p className="text-sm text-muted-foreground">Resumen financiero de la plataforma.</p>
        </div>
        <button className="rounded-md border px-3 py-2 text-sm">Export</button>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border p-4" data-testid="revenue-chart">
          <h2 className="text-sm font-semibold">Revenue Chart</h2>
          <div className="mt-3 h-32 rounded-md bg-muted/40" />
        </div>
        <div className="rounded-xl border p-4" data-testid="plan-distribution">
          <h2 className="text-sm font-semibold">Plan Distribution</h2>
          <div className="mt-3 h-32 rounded-md bg-muted/40" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border p-4" data-testid="mrr">
          <h3 className="text-sm font-semibold">MRR</h3>
          <p className="text-2xl font-bold">$12,450</p>
        </div>
        <div className="rounded-xl border p-4" data-testid="churn-rate">
          <h3 className="text-sm font-semibold">Churn Rate</h3>
          <p className="text-2xl font-bold">2.1%</p>
        </div>
        <div className="rounded-xl border p-4">
          <label className="text-sm font-semibold" htmlFor="period">Periodo</label>
          <select id="period" name="period" className="mt-2 w-full rounded-md border px-3 py-2 text-sm">
            <option value="30">Ultimos 30 dias</option>
            <option value="90">Ultimos 90 dias</option>
          </select>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border p-4" data-testid="invoice-list">
          <h3 className="text-sm font-semibold">Invoice List</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Factura #1024 - $299</li>
            <li>Factura #1023 - $599</li>
          </ul>
        </div>
        <div className="rounded-xl border p-4" data-testid="payment-history">
          <h3 className="text-sm font-semibold">Payment History</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Pago recibido - 12 Ene</li>
            <li>Pago recibido - 10 Ene</li>
          </ul>
        </div>
      </section>
    </main>
  )
}
