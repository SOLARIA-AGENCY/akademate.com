export const metadata = {
  title: 'Certificados - Campus',
}

const certificates = [
  { id: 'cert-1', title: 'Marketing Digital', issued: '10/01/2026' },
  { id: 'cert-2', title: 'Gestión de proyectos', issued: '05/01/2026' },
]

export default function CertificatesPage() {
  return (
    <main className="space-y-6" data-testid="certificates-page">
      <header className="rounded-2xl border border-border bg-card/70 p-6">
        <h1 className="text-3xl font-semibold">Certificados</h1>
        <p className="mt-2 text-sm text-muted-foreground">Descarga tus certificados completados.</p>
      </header>

      <section className="rounded-2xl border border-border bg-card/60 p-6" data-testid="certificates-list">
        <div className="space-y-4">
          {certificates.map((certificate) => (
            <div key={certificate.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="text-sm font-semibold" data-testid="certificate-title">{certificate.title}</div>
              <div className="mt-1 text-xs text-muted-foreground" data-testid="issue-date">
                Emitido el {certificate.issued}
              </div>
              <button className="mt-3 rounded-lg border border-border/60 px-4 py-2 text-xs">Descargar</button>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
