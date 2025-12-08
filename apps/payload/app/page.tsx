export default function Page() {
  return (
    <div className="space-y-6 rounded-2xl border border-border bg-card/70 p-6 shadow-xl shadow-black/30">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Backoffice</p>
          <h1 className="text-2xl font-semibold">Payload + Next</h1>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-medium">
          <span className="rounded-full bg-primary/15 px-3 py-1 text-primary">collections</span>
          <span className="rounded-full bg-secondary/15 px-3 py-1 text-secondary">hooks RLS</span>
          <span className="rounded-full bg-accent/15 px-3 py-1 text-accent">storage</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-background/60 p-4">
          <p className="text-sm text-muted-foreground">Tenants</p>
          <p className="text-3xl font-semibold">RLS</p>
          <p className="mt-2 text-xs text-muted-foreground">Filtros por tenant_id en hooks y SDK.</p>
        </div>
        <div className="rounded-xl border border-border bg-background/60 p-4">
          <p className="text-sm text-muted-foreground">Storage</p>
          <p className="text-3xl font-semibold">R2/MinIO</p>
          <p className="mt-2 text-xs text-muted-foreground">Assets namespaced por tenant con presign.</p>
        </div>
        <div className="rounded-xl border border-border bg-background/60 p-4">
          <p className="text-sm text-muted-foreground">SDK</p>
          <p className="text-3xl font-semibold">api-client</p>
          <p className="mt-2 text-xs text-muted-foreground">Resolver dominio → tenant y añadir claims.</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background/60 p-4">
        <p className="text-sm font-semibold">Siguiente</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Añadir collections base y rutas API edge-safe con rate limiting por tenant.
        </p>
      </div>
    </div>
  )
}
