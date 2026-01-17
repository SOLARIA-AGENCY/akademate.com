export const metadata = {
  title: 'Ops - API Health',
}

export default function ApiHealthPage() {
  return (
    <main className="space-y-6" data-testid="api-health-page">
      <header className="rounded-2xl border border-border bg-card/70 p-6">
        <h1 className="text-2xl font-semibold">API Health</h1>
        <p className="text-sm text-muted-foreground">Estado de endpoints y métricas.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card/60 p-4" data-testid="endpoints-status">
          Endpoints OK
        </div>
        <div className="rounded-2xl border border-border bg-card/60 p-4" data-testid="response-time">
          Response time: 120ms
        </div>
        <div className="rounded-2xl border border-border bg-card/60 p-4" data-testid="api-error-rate">
          Error rate: 0.2%
        </div>
        <div className="rounded-2xl border border-border bg-card/60 p-4" data-testid="api-version">
          API v1.5
        </div>
        <div className="rounded-2xl border border-border bg-card/60 p-4" data-testid="request-count">
          Requests: 42k
        </div>
        <div className="rounded-2xl border border-border bg-card/60 p-4" data-testid="uptime-percentage">
          Uptime 99.99%
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card/60 p-4">
        <button className="rounded-lg border border-border/60 px-3 py-2 text-sm">Refresh Health</button>
        <div className="text-xs text-muted-foreground" data-testid="last-check">Última revisión: hace 3 min</div>
      </section>
    </main>
  )
}
