import Link from 'next/link'

export const metadata = {
  title: 'Curso - Campus',
}

export default function CourseDetailPage() {
  return (
    <main className="space-y-6">
      <header className="rounded-2xl border border-border bg-card/70 p-6">
        <h1 className="text-3xl font-semibold" data-testid="course-title">Curso de ejemplo</h1>
        <p className="mt-2 text-sm text-muted-foreground" data-testid="course-description">
          Aprende con contenidos estructurados y materiales descargables.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card/60 p-6">
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Módulos</div>
          <ul className="modules-list mt-4 space-y-3" data-testid="modules-list">
            {['Introducción', 'Fundamentos', 'Proyecto final'].map((module) => (
              <li key={module} className="rounded-xl border border-border/60 bg-background/40 p-4">
                <div className="text-sm font-semibold">{module}</div>
                <ul className="lessons-list mt-2 list-disc pl-4 text-xs text-muted-foreground" data-testid="lessons-list">
                  <li>Lección 1</li>
                  <li>Lección 2</li>
                </ul>
              </li>
            ))}
          </ul>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card/60 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Progreso</div>
            <div className="progress-bar mt-3 h-2 w-full overflow-hidden rounded-full bg-muted" data-testid="progress-bar">
              <div className="h-full w-2/3 rounded-full bg-primary" />
            </div>
            <div className="mt-3 text-xs text-muted-foreground" data-testid="course-duration">Duración estimada: 6h</div>
          </div>

          <div className="rounded-2xl border border-border bg-card/60 p-4" data-testid="enrollment-info">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Matrícula</div>
            <p className="mt-2 text-sm">Inscrito el 12/01/2026</p>
          </div>

          <div className="rounded-2xl border border-border bg-card/60 p-4" data-testid="instructor-info">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Instructor</div>
            <p className="mt-2 text-sm">Carla Ruiz</p>
          </div>
        </aside>
      </section>

      <div className="flex flex-wrap gap-3">
        <button className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Comenzar</button>
        <Link href="/dashboard" className="rounded-full border border-border/60 px-4 py-2 text-sm">Volver al campus</Link>
      </div>
    </main>
  )
}
