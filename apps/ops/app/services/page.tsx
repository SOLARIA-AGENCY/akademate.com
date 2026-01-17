export const metadata = {
  title: 'Ops - Services',
}

export default function ServicesPage() {
  return (
    <main className="space-y-6" data-testid="services-page">
      <header className="rounded-2xl border border-border bg-card/70 p-6">
        <h1 className="text-2xl font-semibold">Servicios</h1>
        <p className="text-sm text-muted-foreground">Estado y disponibilidad de servicios críticos.</p>
      </header>

      <section className="rounded-2xl border border-border bg-card/60 p-4">
        <div className="flex items-center justify-between gap-3">
          <input
            type="search"
            placeholder="Search services"
            className="w-full max-w-xs rounded-lg border border-border bg-background/80 px-3 py-2 text-sm"
          />
          <div className="pagination text-xs text-muted-foreground" data-testid="pagination">
            1-10 de 24
          </div>
        </div>
        <table className="mt-4 w-full text-left text-sm" data-testid="services-table">
          <thead>
            <tr className="text-xs text-muted-foreground">
              <th className="py-2">Servicio</th>
              <th>Estado</th>
              <th>Uptime</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {['API', 'Jobs', 'Storage'].map((service) => (
              <tr key={service} className="border-t border-border/60">
                <td className="py-3">{service}</td>
                <td>
                  <span className="badge rounded-full border border-emerald-500/30 px-3 py-1 text-xs text-emerald-400" data-testid="status-badge">
                    OK
                  </span>
                </td>
                <td className="uptime text-xs text-muted-foreground" data-testid="uptime">99.9%</td>
                <td className="space-x-2 text-xs">
                  <button className="rounded-lg border border-border/60 px-3 py-1">Restart</button>
                  <button className="rounded-lg border border-border/60 px-3 py-1">Stop</button>
                  <a className="text-primary" href="/logs">Logs</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-2xl border border-border bg-card/60 p-4" data-testid="service-config">
        <h2 className="text-sm font-semibold">Configuración</h2>
        <p className="mt-2 text-xs text-muted-foreground">Variables críticas y límites por servicio.</p>
      </section>
    </main>
  )
}
