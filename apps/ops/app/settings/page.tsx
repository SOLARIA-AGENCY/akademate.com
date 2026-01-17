export const metadata = {
  title: 'Ops - Settings',
}

export default function SettingsPage() {
  return (
    <main className="space-y-6" data-testid="settings-page">
      <header className="rounded-2xl border border-border bg-card/70 p-6">
        <h1 className="text-2xl font-semibold">Configuración</h1>
        <p className="text-sm text-muted-foreground">Parámetros globales del sistema.</p>
      </header>

      <section className="rounded-2xl border border-border bg-card/60 p-4" data-testid="env-config">
        <h2 className="text-sm font-semibold">Entorno</h2>
        <p className="mt-2 text-xs text-muted-foreground">Variables críticas y flags.</p>
      </section>

      <section className="rounded-2xl border border-border bg-card/60 p-4" data-testid="notification-settings">
        <h2 className="text-sm font-semibold">Notificaciones</h2>
        <p className="mt-2 text-xs text-muted-foreground">Canales y alertas.</p>
      </section>

      <section className="rounded-2xl border border-border bg-card/60 p-4" data-testid="api-config">
        <h2 className="text-sm font-semibold">API</h2>
        <p className="mt-2 text-xs text-muted-foreground">Tokens y límites.</p>
      </section>

      <section className="rounded-2xl border border-border bg-card/60 p-4" data-testid="version-info">
        <h2 className="text-sm font-semibold">Versión</h2>
        <p className="mt-2 text-xs text-muted-foreground">v1.5.0</p>
      </section>

      <section className="rounded-2xl border border-border bg-card/60 p-4" data-testid="deploy-info">
        <h2 className="text-sm font-semibold">Deploy</h2>
        <p className="mt-2 text-xs text-muted-foreground">Último deploy: 17/01/2026</p>
      </section>

      <form className="rounded-2xl border border-border bg-card/60 p-4 space-y-3">
        <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Save
        </button>
        <button type="button" className="rounded-lg border border-border/60 px-4 py-2 text-sm">
          Restart System
        </button>
      </form>
    </main>
  )
}
