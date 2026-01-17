import Link from 'next/link'

export const metadata = {
  title: 'Campus - Dashboard',
}

const courses = [
  { id: 'course-1', title: 'Marketing Digital', progress: 64, lessons: '8/12' },
  { id: 'course-2', title: 'Gestión de proyectos', progress: 42, lessons: '5/12' },
  { id: 'course-3', title: 'Diseño UX', progress: 88, lessons: '11/12' },
]

export default function DashboardPage() {
  return (
    <main className="space-y-6" data-testid="dashboard">
      <section className="rounded-2xl border border-border bg-card/70 p-6 shadow-xl shadow-black/30">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Panel del alumno</p>
            <h1 className="text-3xl font-semibold">
              Bienvenida, <span data-testid="user-name">María López</span>
            </h1>
            <p className="text-sm text-muted-foreground">Aquí tienes el estado de tus cursos activos.</p>
          </div>
          <div className="space-y-2 text-right">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Progreso total</div>
            <div className="text-3xl font-semibold" data-testid="completion-rate">68%</div>
            <p className="text-xs text-muted-foreground">+4% respecto a la última semana</p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 lg:flex-row">
        <nav className="flex-1 rounded-2xl border border-border bg-card/60 p-4" data-testid="navigation">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Navegación</div>
          <div className="mt-4 grid gap-2">
            <Link
              className="active rounded-lg border border-primary/50 px-4 py-2 text-sm"
              href="/dashboard"
              data-testid="nav-link"
              data-active="true"
            >
              Dashboard
            </Link>
            <Link className="rounded-lg border border-border/60 px-4 py-2 text-sm hover:border-primary" href="/dashboard" data-testid="nav-link">
              Cursos
            </Link>
            <Link className="rounded-lg border border-border/60 px-4 py-2 text-sm hover:border-primary" href="/progress" data-testid="nav-link">
              Progreso
            </Link>
            <Link className="rounded-lg border border-border/60 px-4 py-2 text-sm hover:border-primary" href="/profile" data-testid="nav-link">
              Perfil
            </Link>
          </div>
        </nav>

        <div className="flex-1 rounded-2xl border border-border bg-card/60 p-4" data-testid="user-profile">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Perfil</div>
          <div className="mt-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/20" />
            <div>
              <div className="text-sm font-semibold">María López</div>
              <div className="text-xs text-muted-foreground">alumno@akademate.com</div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button className="rounded-lg border border-border/60 px-4 py-2 text-xs">Editar perfil</button>
            <button className="rounded-lg border border-border/60 px-4 py-2 text-xs">Preferencias</button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card/60 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Cursos activos</h2>
            <p className="text-sm text-muted-foreground">Continúa donde lo dejaste.</p>
          </div>
          <button className="rounded-full border border-border/60 px-4 py-2 text-xs">Ver todos</button>
        </div>
        <div className="courses-grid mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="courses-grid">
          {courses.map((course) => (
            <article key={course.id} className="course-card rounded-xl border border-border/60 bg-background/40 p-4" data-testid="course-card">
              <div className="text-sm font-semibold">{course.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">Lecciones {course.lessons}</div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progreso</span>
                  <span>{course.progress}%</span>
                </div>
                <div className="progress-bar mt-2 h-2 w-full overflow-hidden rounded-full bg-muted" data-testid="progress-bar">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${course.progress}%` }} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-between rounded-2xl border border-border bg-card/60 p-4">
        <div>
          <div className="text-sm font-semibold">Todo listo para seguir avanzando.</div>
          <div className="text-xs text-muted-foreground">Recuerda completar tus lecciones para desbloquear el certificado.</div>
        </div>
        <button className="rounded-full border border-border/60 px-4 py-2 text-xs">Ver certificados</button>
      </section>

      <div className="flex justify-end">
        <button className="rounded-lg border border-border/60 px-4 py-2 text-xs" type="button">
          Cerrar sesión
        </button>
      </div>
    </main>
  )
}
