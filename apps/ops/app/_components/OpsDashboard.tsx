import Link from 'next/link'
import { OpsLoginForm } from './OpsLoginForm'

export function OpsDashboard() {
  return (
    <main className="grid gap-6 lg:grid-cols-[240px_1fr]" data-testid="dashboard">
      <nav className="space-y-3 rounded-2xl border border-border bg-card/70 p-4" data-testid="sidebar">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Navegación</div>
        <div className="grid gap-2 text-sm">
          <Link className="rounded-lg border border-border/60 px-3 py-2" href="/dashboard">Dashboard</Link>
          <Link className="rounded-lg border border-border/60 px-3 py-2" href="/services">Services</Link>
          <Link className="rounded-lg border border-border/60 px-3 py-2" href="/logs">Logs</Link>
          <Link className="rounded-lg border border-border/60 px-3 py-2" href="/alerts">Alerts</Link>
          <Link className="rounded-lg border border-border/60 px-3 py-2" href="/jobs">Jobs</Link>
          <Link className="rounded-lg border border-border/60 px-3 py-2" href="/settings">Settings</Link>
        </div>
      </nav>

      <div className="space-y-6">
        <section className="rounded-2xl border border-border bg-card/70 p-6 shadow-xl shadow-black/30">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ops / Superadmin</p>
              <h1 className="text-2xl font-semibold">Centro de operaciones</h1>
            </div>
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-400" data-testid="health-status">
              Salud del sistema: OK
            </span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-border bg-background/60 p-4">
              <div className="text-xs text-muted-foreground">Servicios activos</div>
              <div className="text-2xl font-semibold" data-testid="service-count">12</div>
            </div>
            <div className="rounded-xl border border-border bg-background/60 p-4">
              <div className="text-xs text-muted-foreground">Error rate</div>
              <div className="text-2xl font-semibold" data-testid="error-rate">0.3%</div>
            </div>
            <div className="rounded-xl border border-border bg-background/60 p-4">
              <div className="text-xs text-muted-foreground">Uptime</div>
              <div className="text-2xl font-semibold" data-testid="uptime">99.98%</div>
            </div>
            <div className="rounded-xl border border-border bg-background/60 p-4">
              <div className="text-xs text-muted-foreground">Recursos</div>
              <div className="text-2xl font-semibold" data-testid="resource-usage">68%</div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-border bg-card/60 p-4" data-testid="alerts-list">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Alertas recientes</div>
            <div className="mt-3 space-y-2 text-sm">
              <div className="rounded-lg border border-border/60 bg-background/60 p-3">Sin alertas críticas.</div>
              <div className="rounded-lg border border-border/60 bg-background/60 p-3">Latencia API dentro de rangos.</div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card/60 p-4" data-testid="job-queue">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Colas</div>
            <div className="mt-3 space-y-2 text-sm">
              <div className="rounded-lg border border-border/60 bg-background/60 p-3">emails: 4 en cola</div>
              <div className="rounded-lg border border-border/60 bg-background/60 p-3">webhooks: 1 activo</div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-border bg-card/60 p-4" data-testid="user-profile">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Perfil</div>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20" />
              <div>
                <div className="text-sm font-semibold">Ops Manager</div>
                <div className="text-xs text-muted-foreground">ops@akademate.com</div>
              </div>
            </div>
          </div>
          <OpsLoginForm />
        </section>
      </div>
    </main>
  )
}
