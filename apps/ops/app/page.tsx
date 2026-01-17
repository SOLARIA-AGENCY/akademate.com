import { desc, sql } from 'drizzle-orm'
import { getDb, subscriptions, tenants } from '../lib/db'

export const dynamic = 'force-dynamic'

const emptyMetrics = {
  tenantCount: 0,
  activeCount: 0,
  suspendedCount: 0,
  mrrTotal: 0,
}

const emptyBilling = {
  active: 0,
  trialing: 0,
  pastDue: 0,
}

const formatNumber = (value: number) => value.toLocaleString('es-ES')

const formatCurrency = (value: number) => `EUR ${formatNumber(value)}`

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-600',
  trial: 'bg-amber-500/15 text-amber-600',
  suspended: 'bg-rose-500/15 text-rose-500',
}

export default async function Page() {
  let metrics = emptyMetrics
  let recentTenants: Array<{
    id: string
    name: string
    slug: string
    status: string
    plan: string
    mrr: number
    domains: string[]
    updatedAt: Date
  }> = []
  let billing = emptyBilling
  let hasData = true

  try {
    const db = getDb()

    const [metricsRow] = await db
      .select({
        tenantCount: sql<number>`count(*)`,
        activeCount: sql<number>`count(*) filter (where ${tenants.status} = 'active')`,
        suspendedCount: sql<number>`count(*) filter (where ${tenants.status} = 'suspended')`,
        mrrTotal: sql<number>`coalesce(sum(${tenants.mrr}), 0)`,
      })
      .from(tenants)

    metrics = metricsRow ?? emptyMetrics

    recentTenants = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        status: tenants.status,
        plan: tenants.plan,
        mrr: tenants.mrr,
        domains: tenants.domains,
        updatedAt: tenants.updatedAt,
      })
      .from(tenants)
      .orderBy(desc(tenants.updatedAt))
      .limit(8)

    const [billingRow] = await db
      .select({
        active: sql<number>`count(*) filter (where ${subscriptions.status} = 'active')`,
        trialing: sql<number>`count(*) filter (where ${subscriptions.status} = 'trialing')`,
        pastDue: sql<number>`count(*) filter (where ${subscriptions.status} = 'past_due')`,
      })
      .from(subscriptions)

    billing = billingRow ?? emptyBilling
  } catch (error) {
    console.error('Ops dashboard error:', error)
    hasData = false
  }

  return (
    <div className="space-y-6 rounded-2xl border border-border bg-card/70 p-6 shadow-xl shadow-black/30">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Ops / Superadmin</p>
          <h1 className="text-2xl font-semibold">Vision global</h1>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-medium">
          <span className="rounded-full bg-primary/15 px-3 py-1 text-primary">p99 monitor</span>
          <span className="rounded-full bg-secondary/15 px-3 py-1 text-secondary">queues</span>
          <span className="rounded-full bg-accent/15 px-3 py-1 text-accent">billing</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-background/60 p-4">
          <p className="text-sm text-muted-foreground">Tenants</p>
          <p className="text-3xl font-semibold">{formatNumber(metrics.tenantCount)}</p>
          <p className="mt-2 text-xs text-muted-foreground">Total activos y en trial.</p>
        </div>
        <div className="rounded-xl border border-border bg-background/60 p-4">
          <p className="text-sm text-muted-foreground">Activos</p>
          <p className="text-3xl font-semibold">{formatNumber(metrics.activeCount)}</p>
          <p className="mt-2 text-xs text-muted-foreground">Operando con billing al dia.</p>
        </div>
        <div className="rounded-xl border border-border bg-background/60 p-4">
          <p className="text-sm text-muted-foreground">Suspendidos</p>
          <p className="text-3xl font-semibold">{formatNumber(metrics.suspendedCount)}</p>
          <p className="mt-2 text-xs text-muted-foreground">Pendientes de pago o soporte.</p>
        </div>
        <div className="rounded-xl border border-border bg-background/60 p-4">
          <p className="text-sm text-muted-foreground">MRR total</p>
          <p className="text-3xl font-semibold">{formatCurrency(metrics.mrrTotal)}</p>
          <p className="mt-2 text-xs text-muted-foreground">Ingresos recurrentes estimados.</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">Tenants recientes</p>
          <span className="text-xs text-muted-foreground">
            {hasData ? `${recentTenants.length} de ${formatNumber(metrics.tenantCount)}` : 'Sin conexion DB'}
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {recentTenants.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {hasData ? 'No hay tenants registrados.' : 'Configura DATABASE_URL para ver datos.'}
            </p>
          ) : (
            recentTenants.map((tenant) => (
              <div
                key={tenant.id}
                className="flex flex-col gap-3 rounded-lg border border-border/60 bg-background/80 p-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{tenant.name}</p>
                  <p className="text-xs text-muted-foreground">{tenant.slug}</p>
                  <p className="text-xs text-muted-foreground">
                    {tenant.domains?.length ? tenant.domains.join(', ') : 'Sin dominios'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span
                    className={`rounded-full px-3 py-1 font-medium ${statusStyles[tenant.status] ?? 'bg-muted text-muted-foreground'}`}
                  >
                    {tenant.status}
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">{tenant.plan}</span>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                    {tenant.mrr > 0 ? `${formatCurrency(tenant.mrr)}/mes` : 'Trial'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background/60 p-4">
        <p className="text-sm font-semibold">Billing overview</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-border/60 bg-background/80 p-3">
            <p className="text-xs text-muted-foreground">Suscripciones activas</p>
            <p className="text-2xl font-semibold">{formatNumber(billing.active)}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/80 p-3">
            <p className="text-xs text-muted-foreground">En trial</p>
            <p className="text-2xl font-semibold">{formatNumber(billing.trialing)}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/80 p-3">
            <p className="text-xs text-muted-foreground">Past due</p>
            <p className="text-2xl font-semibold">{formatNumber(billing.pastDue)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
