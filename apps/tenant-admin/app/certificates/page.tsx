import { TestShell } from '../_components/TestShell'

export default function CertificatesPage() {
  return (
    <TestShell title="Certificates">
      <section className="space-y-4" data-testid="certificates-page">
        <div className="flex flex-wrap items-center gap-3">
          <select className="rounded border px-3 py-2" data-testid="template-selector">
            <option>Default template</option>
          </select>
          <button className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Issue
          </button>
          <button className="rounded border px-4 py-2 text-sm font-semibold">Download</button>
        </div>

        <div className="rounded border p-4" data-testid="recipient-info">
          Alumno: Carla Gómez
        </div>

        <div className="rounded border p-4" data-testid="certificates-list">
          Certificado #2025-01
        </div>

        <div className="rounded border p-4" data-testid="certificate-preview">
          Vista previa del certificado
        </div>
      </section>
    </TestShell>
  )
}
