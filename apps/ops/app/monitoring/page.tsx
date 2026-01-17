export const metadata = {
  title: 'Ops - Monitoring',
}

export default function MonitoringPage() {
  return (
    <main className="space-y-6" data-testid="monitoring-page">
      <header className="rounded-2xl border border-border bg-card/70 p-6">
        <h1 className="text-2xl font-semibold">Monitoring</h1>
        <p className="text-sm text-muted-foreground">Métricas y rendimiento.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card/60 p-4" data-testid="cpu-chart">
          CPU usage
        </div>
        <div className="rounded-2xl border border-border bg-card/60 p-4" data-testid="memory-chart">
          Memory usage
        </div>
        <div className="rounded-2xl border border-border bg-card/60 p-4" data-testid="disk-chart">
          Disk usage
        </div>
        <div className="rounded-2xl border border-border bg-card/60 p-4" data-testid="network-io">
          Network I/O
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card/60 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <button className="rounded-lg border border-border/60 px-3 py-2 text-sm" data-testid="time-range" type="button">
            Últimas 24h
          </button>
          <button className="rounded-lg border border-border/60 px-3 py-2 text-sm">Refresh</button>
          <div className="text-xs text-muted-foreground" data-testid="alert-thresholds">
            Umbrales configurados
          </div>
          <div className="text-xs text-muted-foreground" data-testid="incident-count">
            Incidentes: 0
          </div>
          <div className="text-xs text-muted-foreground" data-testid="health-score">
            Health score: 98
          </div>
        </div>
      </section>
    </main>
  )
}
