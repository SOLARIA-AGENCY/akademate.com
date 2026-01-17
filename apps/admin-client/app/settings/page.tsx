export default function SettingsPage() {
  return (
    <main className="p-6 space-y-6" data-testid="settings-page">
      <header>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Configuración del sistema.</p>
      </header>

      <section className="rounded-xl border p-4" data-testid="system-config">
        <h2 className="text-sm font-semibold">System Configuration</h2>
        <p className="mt-2 text-sm text-muted-foreground">Opciones globales del sistema.</p>
      </section>

      <section className="rounded-xl border p-4" data-testid="notification-settings">
        <h2 className="text-sm font-semibold">Notification Settings</h2>
        <p className="mt-2 text-sm text-muted-foreground">Preferencias de alertas.</p>
      </section>

      <section className="rounded-xl border p-4" data-testid="security-settings">
        <h2 className="text-sm font-semibold">Security Settings</h2>
        <p className="mt-2 text-sm text-muted-foreground">Requisitos de seguridad.</p>
      </section>

      <section className="rounded-xl border p-4" data-testid="api-keys">
        <h2 className="text-sm font-semibold">API Keys</h2>
        <p className="mt-2 text-sm text-muted-foreground">Gestión de credenciales API.</p>
      </section>

      <section className="rounded-xl border p-4" data-testid="webhook-config">
        <h2 className="text-sm font-semibold">Webhook Configuration</h2>
        <p className="mt-2 text-sm text-muted-foreground">Endpoints configurados.</p>
      </section>

      <button
        type="submit"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Save Settings
      </button>
    </main>
  )
}
