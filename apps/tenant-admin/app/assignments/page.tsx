import { TestShell } from '../_components/TestShell'

export default function AssignmentsPage() {
  return (
    <TestShell title="Assignments" data-oid="1xtt6.a">
      <section className="space-y-4" data-testid="assignments-page" data-oid="ngf8coy">
        <div className="rounded border p-4" data-testid="assignment-details" data-oid="vx5-nq:">
          <h2 className="font-semibold" data-oid="niyk..z">
            Entrega Proyecto Final
          </h2>
          <p className="text-sm text-muted-foreground" data-oid="n:wdquq">
            Curso: Fullstack
          </p>
        </div>

        <div className="rounded border p-4" data-testid="submissions-list" data-oid="g62t2un">
          <div className="flex items-center justify-between" data-oid="5ul_hnq">
            <span
              className="text-sm text-muted-foreground"
              data-testid="pending-count"
              data-oid="3.l5izl"
            >
              3 submissions pending
            </span>
            <button className="rounded border px-3 py-1 text-xs" data-oid="m1cbbss">
              Submit Grade
            </button>
          </div>
          <div className="mt-4 space-y-2" data-oid="rlrxnjq">
            <input
              type="number"
              className="w-24 rounded border px-2 py-1"
              data-testid="grade-input"
              data-oid="lq711wy"
            />
            <textarea
              className="w-full rounded border p-2"
              data-testid="feedback"
              data-oid="-wo611k"
            />
            <a
              href="#"
              className="text-sm text-primary"
              data-testid="file-attachment"
              data-oid=":yoviw3"
            >
              Ver entrega
            </a>
          </div>
        </div>
      </section>
    </TestShell>
  )
}
