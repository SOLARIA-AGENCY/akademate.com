import { TestShell } from '../_components/TestShell'

export default function ReportsPage() {
  return (
    <TestShell title="Reports">
      <section className="space-y-4" data-testid="reports-page">
        <div className="flex flex-wrap items-center gap-3" data-testid="report-types">
          <span className="rounded border px-3 py-1 text-sm">Revenue</span>
          <span className="rounded border px-3 py-1 text-sm">Attendance</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input type="date" className="rounded border px-3 py-2" data-testid="date-range" />
          <select className="rounded border px-3 py-2" data-testid="export-format">
            <option>PDF</option>
          </select>
          <button className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Generate
          </button>
          <button className="rounded border px-4 py-2 text-sm font-semibold">Download</button>
        </div>

        <div className="rounded border p-4" data-testid="reports-list">
          Reporte Enero 2026
        </div>
      </section>
    </TestShell>
  )
}
