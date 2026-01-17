import { TestShell } from '../_components/TestShell'

export default function AssignmentsPage() {
  return (
    <TestShell title="Assignments">
      <section className="space-y-4" data-testid="assignments-page">
        <div className="rounded border p-4" data-testid="assignment-details">
          <h2 className="font-semibold">Entrega Proyecto Final</h2>
          <p className="text-sm text-muted-foreground">Curso: Fullstack</p>
        </div>

        <div className="rounded border p-4" data-testid="submissions-list">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground" data-testid="pending-count">
              3 submissions pending
            </span>
            <button className="rounded border px-3 py-1 text-xs">Submit Grade</button>
          </div>
          <div className="mt-4 space-y-2">
            <input type="number" className="w-24 rounded border px-2 py-1" data-testid="grade-input" />
            <textarea className="w-full rounded border p-2" data-testid="feedback" />
            <a href="#" className="text-sm text-primary" data-testid="file-attachment">
              Ver entrega
            </a>
          </div>
        </div>
      </section>
    </TestShell>
  )
}
