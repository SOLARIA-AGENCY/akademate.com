export const metadata = {
  title: 'Ops - Alerts',
}

export default function AlertsPage() {
  return (
    <main className="space-y-6" data-testid="alerts-page">
      <header className="rounded-2xl border border-border bg-card/70 p-6">
        <h1 className="text-2xl font-semibold">Alertas</h1>
        <p className="text-sm text-muted-foreground">Eventos y avisos críticos.</p>
      </header>

      <section className="rounded-2xl border border-border bg-card/60 p-4" data-testid="active-alerts">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">API latency spike</div>
            <div className="timestamp text-xs text-muted-foreground" data-testid="timestamp">2026-01-17 12:10</div>
          </div>
          <span className="badge rounded-full border border-rose-500/30 px-3 py-1 text-xs text-rose-400" data-severity>
            Critical
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card/60 p-4" data-testid="alert-details">
        <h2 className="text-sm font-semibold">Detalles</h2>
        <p className="mt-2 text-xs text-muted-foreground">Sin detalles adicionales.</p>
      </section>

      <section className="rounded-2xl border border-border bg-card/60 p-4" data-testid="alert-history">
        <h2 className="text-sm font-semibold">Historial</h2>
        <p className="mt-2 text-xs text-muted-foreground">No hay historial reciente.</p>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button className="rounded-lg border border-border/60 px-3 py-2 text-sm">Acknowledge</button>
        <button className="rounded-lg border border-border/60 px-3 py-2 text-sm">Resolve</button>
        <button className="rounded-lg border border-border/60 px-3 py-2 text-sm">Clear</button>
      </div>
    </main>
  )
}
