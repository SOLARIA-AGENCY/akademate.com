export const metadata = {
  title: 'Progreso - Campus',
}

export default function ProgressPage() {
  return (
    <main className="space-y-6" data-testid="progress-page">
      <header className="rounded-2xl border border-border bg-card/70 p-6">
        <h1 className="text-3xl font-semibold">Progreso</h1>
        <p className="mt-2 text-sm text-muted-foreground" data-testid="overall-progress">68% completado</p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card/60 p-4" data-testid="completed-lessons">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Lecciones completadas</div>
          <div className="mt-2 text-2xl font-semibold">24</div>
        </div>
        <div className="rounded-2xl border border-border bg-card/60 p-4" data-testid="total-lessons">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Lecciones totales</div>
          <div className="mt-2 text-2xl font-semibold">35</div>
        </div>
        <div className="rounded-2xl border border-border bg-card/60 p-4" data-testid="time-spent">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Tiempo invertido</div>
          <div className="mt-2 text-2xl font-semibold">18h 20m</div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card/60 p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Progreso por curso</div>
        <div className="mt-4 space-y-3" data-testid="course-progress">
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <div className="text-sm font-semibold">Marketing Digital</div>
            <div className="progress-bar mt-2 h-2 w-full overflow-hidden rounded-full bg-muted" data-testid="progress-bar">
              <div className="h-full w-2/3 rounded-full bg-primary" />
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <div className="text-sm font-semibold">Gestión de proyectos</div>
            <div className="progress-bar mt-2 h-2 w-full overflow-hidden rounded-full bg-muted" data-testid="progress-bar">
              <div className="h-full w-1/2 rounded-full bg-secondary" />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card/60 p-6" data-testid="certificates">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Certificados</div>
        <p className="mt-2 text-sm text-muted-foreground">Tus certificados disponibles aparecerán aquí.</p>
        <button className="mt-4 rounded-lg border border-border/60 px-4 py-2 text-sm">Descargar</button>
      </section>
    </main>
  )
}
