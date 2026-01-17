export const metadata = {
  title: 'Entrega - Campus',
}

export default function AssignmentPage() {
  return (
    <main className="space-y-6">
      <header className="rounded-2xl border border-border bg-card/70 p-6">
        <h1 className="text-3xl font-semibold" data-testid="assignment-title">Entrega: Proyecto final</h1>
        <p className="mt-2 text-sm text-muted-foreground" data-testid="assignment-instructions">
          Sube tu archivo en PDF antes de la fecha límite.
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-card/60 p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Fecha límite</div>
        <div className="mt-2 text-sm" data-testid="due-date">25/01/2026</div>
        <div className="mt-4 text-xs text-muted-foreground" data-testid="max-score">Puntuación máxima: 100</div>
      </section>

      <form className="rounded-2xl border border-border bg-card/60 p-6 space-y-4" data-testid="submission-form">
        <label className="block text-sm">
          <span className="text-xs text-muted-foreground">Archivo</span>
          <input className="mt-2 block w-full rounded-lg border border-border bg-background/60 p-2 text-sm" type="file" />
        </label>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" type="submit">
          Entregar
        </button>
      </form>

      <section className="rounded-2xl border border-border bg-card/60 p-6" data-testid="previous-submissions">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Entregas anteriores</div>
        <p className="mt-2 text-sm text-muted-foreground">Aún no hay entregas previas.</p>
      </section>

      <section className="rounded-2xl border border-border bg-card/60 p-6" data-testid="grade-display">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Calificación</div>
        <p className="mt-2 text-sm">Pendiente de revisión</p>
      </section>

      <section className="rounded-2xl border border-border bg-card/60 p-6" data-testid="feedback-display">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Feedback</div>
        <p className="mt-2 text-sm text-muted-foreground">Sin comentarios todavía.</p>
      </section>
    </main>
  )
}
