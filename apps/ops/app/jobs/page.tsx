export const metadata = {
  title: 'Ops - Jobs',
}

export default function JobsPage() {
  return (
    <main className="space-y-6" data-testid="jobs-page">
      <header className="rounded-2xl border border-border bg-card/70 p-6">
        <h1 className="text-2xl font-semibold">Colas de trabajo</h1>
        <p className="text-sm text-muted-foreground">Estado de trabajos y reintentos.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card/60 p-4" data-testid="queued-count">En cola: 4</div>
        <div className="rounded-2xl border border-border bg-card/60 p-4" data-testid="active-count">Activos: 1</div>
        <div className="rounded-2xl border border-border bg-card/60 p-4" data-testid="completed-count">Completados: 32</div>
        <div className="rounded-2xl border border-border bg-card/60 p-4" data-testid="failed-count">Fallidos: 0</div>
      </section>

      <section className="rounded-2xl border border-border bg-card/60 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <button className="rounded-lg border border-border/60 px-3 py-2 text-sm" data-testid="job-type-filter" type="button">
            Todos los tipos
          </button>
          <button className="rounded-lg border border-border/60 px-3 py-2 text-sm">Retry</button>
          <button className="rounded-lg border border-border/60 px-3 py-2 text-sm">Clear</button>
        </div>
        <div className="mt-4 text-xs text-muted-foreground" data-testid="execution-time">
          Ejecución promedio: 2.3s
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card/60 p-4" data-testid="job-details">
        <h2 className="text-sm font-semibold">Detalles</h2>
        <p className="mt-2 text-xs text-muted-foreground">Selecciona un job para ver detalles.</p>
      </section>
    </main>
  )
}
