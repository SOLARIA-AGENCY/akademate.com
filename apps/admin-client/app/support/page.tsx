export default function SupportPage() {
  return (
    <main className="p-6 space-y-6" data-testid="support-page">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Support</h1>
          <p className="text-sm text-muted-foreground">Gestión de tickets y soporte.</p>
        </div>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Create Ticket
        </button>
      </header>

      <section className="rounded-xl border p-4" data-testid="tickets-list">
        <h2 className="text-sm font-semibold">Tickets</h2>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <span>Problema de acceso</span>
            <span className="badge px-2 py-1 text-xs">Open</span>
          </div>
          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <span>Fallo en facturación</span>
            <span className="badge px-2 py-1 text-xs">Priority</span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border p-4" data-testid="ticket-details">
          <h3 className="text-sm font-semibold">Ticket Details</h3>
          <p className="mt-2 text-sm text-muted-foreground">Detalle del ticket seleccionado.</p>
        </div>
        <div className="rounded-xl border p-4" data-testid="assignee">
          <h3 className="text-sm font-semibold">Assignee</h3>
          <p className="mt-2 text-sm text-muted-foreground">Equipo de soporte asignado.</p>
        </div>
      </section>
    </main>
  )
}
