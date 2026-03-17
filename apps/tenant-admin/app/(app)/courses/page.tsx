import { TestShell } from '../_components/TestShell'

export default function CoursesPage() {
  return (
    <TestShell title="Courses" data-oid="._kpwt9">
      <section
        className="flex flex-wrap items-center gap-3"
        data-testid="courses-page"
        data-oid="yhy437b"
      >
        <select className="rounded border px-3 py-2" data-testid="status-filter" data-oid="pbhplff">
          <option data-oid="k3y2ler">All statuses</option>
        </select>
        <button
          className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          data-oid="h5_dx_7"
        >
          Create Course
        </button>
      </section>

      <div
        className="courses-list grid gap-4 md:grid-cols-2"
        data-testid="courses-list"
        data-oid="i3spl_o"
      >
        <article className="rounded border p-4" data-oid="rv1t71g">
          <img
            src="/placeholder-course.png"
            alt="Course"
            className="course-thumbnail mb-3 h-24 w-full rounded object-cover"
            data-testid="course-thumbnail"
            data-oid="tdifjky"
          />

          <div className="flex items-center justify-between" data-oid="umqw-3s">
            <h2 className="font-semibold" data-oid="tfkoevp">
              Fullstack Bootcamp
            </h2>
            <span className="badge" data-testid="status-badge" data-oid="qbeaium">
              Active
            </span>
          </div>
          <p className="text-sm text-muted-foreground" data-oid="-9lh_n5">
            Enrollments:{' '}
            <span data-testid="enrollment-count" data-oid="vyjix:g">
              32
            </span>
          </p>
          <button className="mt-2 rounded border px-3 py-1 text-xs" data-oid="oxoka:.">
            Edit
          </button>
        </article>
      </div>
    </TestShell>
  )
}
