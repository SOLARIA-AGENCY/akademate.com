export default function Page() {
  return (
    <div className="space-y-6 rounded-2xl border border-border bg-card/70 p-6 shadow-xl shadow-black/30">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Ops / Superadmin</p>
          <h1 className="text-2xl font-semibold">Visión global</h1>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-medium">
          <span className="rounded-full bg-primary/15 px-3 py-1 text-primary">p99 monitor</span>
          <span className="rounded-full bg-secondary/15 px-3 py-1 text-secondary">queues</span>
          <span className="rounded-full bg-accent/15 px-3 py-1 text-accent">billing</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-background/60 p-4">
          <p className="text-sm text-muted-foreground">Tenants</p>
          <p className="text-3xl font-semibold">multi</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Resolución por dominio y claims; filtros y métricas listos para RLS.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background/60 p-4">
          <p className="text-sm text-muted-foreground">Salud</p>
          <p className="text-3xl font-semibold">99.9%</p>
          <p className="mt-2 text-xs text-muted-foreground">Checks de API, colas y storage por tenant.</p>
        </div>
        <div className="rounded-xl border border-border bg-background/60 p-4">
          <p className="text-sm text-muted-foreground">Auditoría</p>
          <p className="text-3xl font-semibold">on</p>
          <p className="mt-2 text-xs text-muted-foreground">Eventos sensibles y cambios críticos trackeados.</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background/60 p-4">
        <p className="text-sm font-semibold">Proximo</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Conectar con Payload y Drizzle, añadir dashboards reales y feature flags.
        </p>
      </div>
    </div>
  )
}
