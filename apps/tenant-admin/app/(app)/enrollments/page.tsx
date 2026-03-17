import { TestShell } from '../_components/TestShell'

export default function EnrollmentsPage() {
  return (
    <TestShell title="Enrollments" data-oid="7xexc.w">
      <section data-testid="enrollments-page" data-oid="yf7i8_n">
        <table className="w-full border" data-testid="enrollments-table" data-oid="bxla1fs">
          <thead className="bg-muted" data-oid="7rka1q-">
            <tr data-oid="r1:ytz7">
              <th className="px-4 py-2 text-left" data-oid="avv3lux">
                Student
              </th>
              <th className="px-4 py-2 text-left" data-oid="0_80c5s">
                Course
              </th>
              <th className="px-4 py-2 text-left" data-oid="435j88v">
                Status
              </th>
              <th className="px-4 py-2 text-left" data-oid="-yboymm">
                Progress
              </th>
              <th className="px-4 py-2 text-left" data-oid="3-tni_f">
                Actions
              </th>
            </tr>
          </thead>
          <tbody data-oid=":zkvtap">
            <tr className="border-t" data-oid="kfl0h0j">
              <td className="px-4 py-2" data-testid="student-info" data-oid="wkzb9is">
                Ana Pérez
              </td>
              <td className="px-4 py-2" data-testid="course-info" data-oid="90va.dx">
                UX Design
              </td>
              <td className="px-4 py-2" data-oid="crrsrdz">
                <span className="badge" data-testid="status-badge" data-oid="_rxqjxp">
                  Pending
                </span>
              </td>
              <td className="px-4 py-2" data-oid="a:0c89m">
                <div className="progress-bar" data-testid="progress-bar" data-oid="25ihwz_">
                  60%
                </div>
              </td>
              <td className="px-4 py-2 space-x-2" data-oid="xlkp_ua">
                <button className="rounded border px-3 py-1 text-xs" data-oid="fzd_xam">
                  Approve
                </button>
                <button className="rounded border px-3 py-1 text-xs" data-oid="fwgzwvj">
                  Reject
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="mt-4 text-sm" data-testid="enrollment-date" data-oid="fo.r02o">
          2025-10-12
        </div>
      </section>
    </TestShell>
  )
}
