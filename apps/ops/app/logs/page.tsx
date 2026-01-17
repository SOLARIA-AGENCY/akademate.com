export const metadata = {
  title: 'Ops - Logs',
}

export default function LogsPage() {
  return (
    <main className="space-y-6" data-testid="logs-page">
      <header className="rounded-2xl border border-border bg-card/70 p-6">
        <h1 className="text-2xl font-semibold">Logs</h1>
        <p className="text-sm text-muted-foreground">Historial de eventos del sistema.</p>
      </header>

      <section className="rounded-2xl border border-border bg-card/60 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <button className="rounded-lg border border-border/60 px-3 py-1 text-sm">Error</button>
          <button className="rounded-lg border border-border/60 px-3 py-1 text-sm">Warning</button>
          <button className="rounded-lg border border-border/60 px-3 py-1 text-sm">Export</button>
          <input
            type="search"
            placeholder="Search logs"
            className="ml-auto w-full max-w-xs rounded-lg border border-border bg-background/80 px-3 py-2 text-sm"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card/60 p-4" data-testid="log-entries">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span data-testid="timestamp">2026-01-17 12:40</span>
          <span data-testid="log-level" className="uppercase">info</span>
        </div>
        <p className="mt-2 text-sm">Sistema estable.</p>
      </section>

      <section className="rounded-2xl border border-border bg-card/60 p-4" data-testid="log-details">
        <h2 className="text-sm font-semibold">Detalles</h2>
        <p className="mt-2 text-xs text-muted-foreground">Selecciona un log para ver detalles.</p>
      </section>

      <div className="rounded-lg border border-border bg-card/60 px-4 py-2 text-xs text-muted-foreground" data-testid="auto-refresh">
        Auto-refresh activo
      </div>
    </main>
  )
}
