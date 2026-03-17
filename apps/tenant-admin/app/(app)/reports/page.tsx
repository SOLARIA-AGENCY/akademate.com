import { TestShell } from '../_components/TestShell'

export default function ReportsPage() {
  return (
    <TestShell title="Reports" data-oid="057w27o">
      <section className="space-y-4" data-testid="reports-page" data-oid="an-9k.p">
        <div
          className="flex flex-wrap items-center gap-3"
          data-testid="report-types"
          data-oid="8ak0b1v"
        >
          <span className="rounded border px-3 py-1 text-sm" data-oid=".icwjvj">
            Revenue
          </span>
          <span className="rounded border px-3 py-1 text-sm" data-oid="awke0hj">
            Attendance
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3" data-oid="eph2nu:">
          <input
            type="date"
            className="rounded border px-3 py-2"
            data-testid="date-range"
            data-oid="fd9sdbk"
          />
          <select
            className="rounded border px-3 py-2"
            data-testid="export-format"
            data-oid="6:hlpel"
          >
            <option data-oid="0fltcxo">PDF</option>
          </select>
          <button
            className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            data-oid="h_b5vjo"
          >
            Generate
          </button>
          <button className="rounded border px-4 py-2 text-sm font-semibold" data-oid="3ixdi77">
            Download
          </button>
        </div>

        <div className="rounded border p-4" data-testid="reports-list" data-oid="wvyuf_m">
          Reporte Enero 2026
        </div>
      </section>
    </TestShell>
  )
}
