import Link from 'next/link'

const tenants = [
  {
    id: 'cepfp',
    name: 'CEFP Akademate',
    type: 'FP',
    status: 'Activa',
    href: '/campus/cepfp',
  },
  {
    id: 'solaria',
    name: 'Solaria Academy',
    type: 'Bootcamp',
    status: 'Activa',
    href: '/campus/solaria',
  },
  {
    id: 'nova',
    name: 'Nova School',
    type: 'Corporate',
    status: 'Activa',
    href: '/admin/nova',
  },
]

export default function PortalPage() {
  return (
    <div className="min-h-screen bg-transparent text-white">
      <header className="border-b border-slate-800 bg-slate-950/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <img
              className="logo h-10 w-10 rounded-lg bg-slate-900 p-1"
              data-testid="logo"
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%2306b6d4'/%3E%3Cpath d='M16 44V20l16-8 16 8v24l-16 8-16-8z' fill='white'/%3E%3C/svg%3E"
              alt="Akademate"
            />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">Akademate</p>
              <h1 className="text-xl font-semibold">Portal de acceso</h1>
            </div>
          </div>
          <nav className="flex items-center gap-4 text-sm" data-testid="navigation">
            <Link className="hover:text-cyan-300" href="/">Inicio</Link>
            <Link className="hover:text-cyan-300" href="/about">Sobre</Link>
            <Link className="hover:text-cyan-300" href="/contact">Contacto</Link>
            <Link className="rounded-full border border-slate-700 px-3 py-1 text-xs" href="/login">
              Login
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-6 py-10">
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-8">
            <h2 className="text-3xl font-semibold">Selecciona tu academia</h2>
            <p className="mt-2 text-sm text-slate-400">
              Encuentra tu campus virtual o panel administrativo para continuar.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="text-xs text-slate-400">
                Academia
                <button
                  className="mt-2 flex w-full items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm"
                  data-testid="tenant-selector"
                  type="button"
                >
                  Selecciona una academia
                  <span className="text-slate-500">▾</span>
                </button>
              </div>
              <div className="text-xs text-slate-400">
                Tipo
                <button
                  className="mt-2 flex w-full items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm"
                  data-testid="tenant-filter"
                  type="button"
                >
                  Todos
                  <span className="text-slate-500">▾</span>
                </button>
              </div>
            </div>
            <div className="mt-4">
              <input
                className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm"
                type="search"
                placeholder="Search academies"
              />
            </div>
          </div>

          <aside className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
            <h3 className="text-lg font-semibold">Accesos rápidos</h3>
            <p className="mt-2 text-xs text-slate-400">
              Usa estos enlaces si ya conoces tu destino.
            </p>
            <div className="mt-4 grid gap-3">
              <Link className="rounded-lg border border-slate-800 px-4 py-2 text-sm" href="/campus/cepfp" role="button">
                Campus alumno
              </Link>
              <Link className="rounded-lg border border-slate-800 px-4 py-2 text-sm" href="/admin/cepfp" role="button">
                Admin academia
              </Link>
              <Link className="rounded-lg border border-slate-800 px-4 py-2 text-sm" href="/login" role="button">
                Login centralizado
              </Link>
            </div>
          </aside>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Academias disponibles</h3>
              <p className="text-sm text-slate-400">Selecciona para acceder.</p>
            </div>
          </div>
          <div className="academy-list mt-6 grid gap-4 md:grid-cols-2" data-testid="academy-list">
            {tenants.map((tenant) => (
              <article
                key={tenant.id}
                className="tenant-card rounded-2xl border border-slate-800 bg-slate-950/60 p-5"
                data-testid="tenant-card"
              >
                <div className="flex items-center gap-3">
                  <img
                    className="tenant-logo h-10 w-10 rounded-lg bg-slate-800 p-2"
                    data-testid="tenant-logo"
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%230f172a'/%3E%3Ccircle cx='32' cy='32' r='16' fill='%2306b6d4'/%3E%3C/svg%3E"
                    alt={`${tenant.name} logo`}
                  />
                  <div>
                    <div className="tenant-name text-sm font-semibold" data-testid="tenant-name">
                      {tenant.name}
                    </div>
                    <div className="text-xs text-slate-400">Tipo: {tenant.type}</div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="badge rounded-full border border-emerald-500/30 px-3 py-1 text-xs text-emerald-400" data-testid="status-badge">
                    {tenant.status}
                  </span>
                  <Link
                    className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950"
                    href="/login"
                    role="button"
                  >
                    Acceder
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-slate-950/60" data-testid="footer">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row">
          <p className="text-sm text-slate-400" data-testid="copyright">
            © 2026 Akademate. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <Link href="/privacy">Privacidad</Link>
            <Link href="/terms">Términos</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
