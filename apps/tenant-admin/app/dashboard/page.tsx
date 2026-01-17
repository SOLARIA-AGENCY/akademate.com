import { TestShell } from '../_components/TestShell'

export default function DashboardPage() {
  return (
    <TestShell title="Dashboard">
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded border p-4" data-testid="student-count">
          <p className="text-sm text-muted-foreground">Alumnos</p>
          <p className="text-2xl font-semibold">128</p>
        </div>
        <div className="rounded border p-4" data-testid="course-count">
          <p className="text-sm text-muted-foreground">Cursos</p>
          <p className="text-2xl font-semibold">24</p>
        </div>
        <div className="rounded border p-4" data-testid="pending-assignments">
          <p className="text-sm text-muted-foreground">Tareas pendientes</p>
          <p className="text-2xl font-semibold">7</p>
        </div>
        <div className="rounded border p-4" data-testid="recent-enrollments">
          <p className="text-sm text-muted-foreground">Inscripciones recientes</p>
          <p className="text-sm">María López · Fullstack</p>
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        <button className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Add Student
        </button>
        <button className="rounded border px-4 py-2 text-sm font-semibold">
          Create Course
        </button>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded border p-4" data-testid="user-profile">
          <p className="text-sm text-muted-foreground">Usuario</p>
          <p className="font-medium">Admin User</p>
        </div>
        <div className="rounded border p-4" data-testid="academy-name">
          <p className="text-sm text-muted-foreground">Academia</p>
          <p className="font-medium">Akademate Demo</p>
        </div>
      </section>

      <button className="rounded border px-4 py-2 text-sm font-semibold">Logout</button>
    </TestShell>
  )
}
