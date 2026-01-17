export const metadata = {
  title: 'Ops - Database',
}

export default function DatabasePage() {
  return (
    <main className="space-y-6" data-testid="database-page">
      <header className="rounded-2xl border border-border bg-card/70 p-6">
        <h1 className="text-2xl font-semibold">Base de datos</h1>
        <p className="text-sm text-muted-foreground">Estado de conexión y métricas clave.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card/60 p-4" data-testid="connection-status">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Conexión</div>
          <div className="mt-2 text-lg font-semibold">Online</div>
        </div>
        <div className="rounded-2xl border border-border bg-card/60 p-4" data-testid="db-size">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Tamaño</div>
          <div className="mt-2 text-lg font-semibold">128 GB</div>
        </div>
        <div className="rounded-2xl border border-border bg-card/60 p-4" data-testid="connection-count">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Conexiones activas</div>
          <div className="mt-2 text-lg font-semibold">42</div>
        </div>
        <div className="rounded-2xl border border-border bg-card/60 p-4" data-testid="query-performance">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Rendimiento</div>
          <div className="mt-2 text-lg font-semibold">P95 120ms</div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card/60 p-4" data-testid="slow-queries">
        <h2 className="text-sm font-semibold">Consultas lentas</h2>
        <p className="mt-2 text-xs text-muted-foreground">Sin consultas críticas en la última hora.</p>
      </section>

      <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card/60 p-4">
        <button className="rounded-lg border border-border/60 px-3 py-2 text-sm">Backup</button>
        <button className="rounded-lg border border-border/60 px-3 py-2 text-sm">Restore</button>
        <div className="text-xs text-muted-foreground" data-testid="last-backup">Último backup: hace 2h</div>
        <div className="text-xs text-muted-foreground" data-testid="migration-status">Migraciones: OK</div>
      </section>
    </main>
  )
}
