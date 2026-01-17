import { TestShell } from '../_components/TestShell'

export default function EnrollmentsPage() {
  return (
    <TestShell title="Enrollments">
      <section data-testid="enrollments-page">
        <table className="w-full border" data-testid="enrollments-table">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-2 text-left">Student</th>
              <th className="px-4 py-2 text-left">Course</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Progress</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="px-4 py-2" data-testid="student-info">
                Ana Pérez
              </td>
              <td className="px-4 py-2" data-testid="course-info">
                UX Design
              </td>
              <td className="px-4 py-2">
                <span className="badge" data-testid="status-badge">
                  Pending
                </span>
              </td>
              <td className="px-4 py-2">
                <div className="progress-bar" data-testid="progress-bar">
                  60%
                </div>
              </td>
              <td className="px-4 py-2 space-x-2">
                <button className="rounded border px-3 py-1 text-xs">Approve</button>
                <button className="rounded border px-3 py-1 text-xs">Reject</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="mt-4 text-sm" data-testid="enrollment-date">
          2025-10-12
        </div>
      </section>
    </TestShell>
  )
}
