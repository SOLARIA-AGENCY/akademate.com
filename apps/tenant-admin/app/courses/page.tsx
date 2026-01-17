import { TestShell } from '../_components/TestShell'

export default function CoursesPage() {
  return (
    <TestShell title="Courses">
      <section className="flex flex-wrap items-center gap-3" data-testid="courses-page">
        <select className="rounded border px-3 py-2" data-testid="status-filter">
          <option>All statuses</option>
        </select>
        <button className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Create Course
        </button>
      </section>

      <div className="courses-list grid gap-4 md:grid-cols-2" data-testid="courses-list">
        <article className="rounded border p-4">
          <img
            src="/placeholder-course.png"
            alt="Course"
            className="course-thumbnail mb-3 h-24 w-full rounded object-cover"
            data-testid="course-thumbnail"
          />
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Fullstack Bootcamp</h2>
            <span className="badge" data-testid="status-badge">
              Active
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Enrollments: <span data-testid="enrollment-count">32</span>
          </p>
          <button className="mt-2 rounded border px-3 py-1 text-xs">Edit</button>
        </article>
      </div>
    </TestShell>
  )
}
