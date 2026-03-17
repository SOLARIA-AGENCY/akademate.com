import { TestShell } from '../_components/TestShell'

export default function CertificatesPage() {
  return (
    <TestShell title="Certificates" data-oid=".stanni">
      <section className="space-y-4" data-testid="certificates-page" data-oid="3q638tq">
        <div className="flex flex-wrap items-center gap-3" data-oid="l::9oct">
          <select
            className="rounded border px-3 py-2"
            data-testid="template-selector"
            data-oid="cmw71th"
          >
            <option data-oid="rdo50pu">Default template</option>
          </select>
          <button
            className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            data-oid="3zm2p3k"
          >
            Issue
          </button>
          <button className="rounded border px-4 py-2 text-sm font-semibold" data-oid="sf:xzsv">
            Download
          </button>
        </div>

        <div className="rounded border p-4" data-testid="recipient-info" data-oid="cs-5k0_">
          Alumno: Carla Gómez
        </div>

        <div className="rounded border p-4" data-testid="certificates-list" data-oid="i1exynz">
          Certificado #2025-01
        </div>

        <div className="rounded border p-4" data-testid="certificate-preview" data-oid="iv9.hcs">
          Vista previa del certificado
        </div>
      </section>
    </TestShell>
  )
}
