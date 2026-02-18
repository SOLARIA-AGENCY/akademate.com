import { cookies } from 'next/headers'
import { fetchCertificates, type CertificateData } from '../../lib/api'

export const metadata = {
  title: 'Certificados - Campus',
}

/**
 * Resolve the course title from a certificate's course_run field.
 * course_run may be a populated object (depth >= 1) or a raw ID string.
 */
function getCourseRunTitle(certificate: CertificateData): string {
  if (certificate.course_run && typeof certificate.course_run === 'object') {
    return certificate.course_run.title
  }
  return certificate.certificate_number
}

/**
 * Build the download URL for a certificate PDF.
 * Prefers pdf_url, falls back to pdf_file.url if the upload was populated.
 */
function getPdfDownloadUrl(certificate: CertificateData): string | null {
  if (certificate.pdf_url) return certificate.pdf_url
  if (certificate.pdf_file && typeof certificate.pdf_file === 'object' && certificate.pdf_file.url) {
    return certificate.pdf_file.url
  }
  return null
}

export default async function CertificatesPage() {
  let certificates: CertificateData[] = []
  let fetchError: string | null = null

  try {
    const cookieStore = await cookies()
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ')

    const result = await fetchCertificates({ cookie: cookieHeader })
    certificates = result.docs
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Error al cargar los certificados'
  }

  return (
    <main className="space-y-6" data-testid="certificates-page">
      <header className="rounded-2xl border border-border bg-card/70 p-6">
        <h1 className="text-3xl font-semibold">Certificados</h1>
        <p className="mt-2 text-sm text-muted-foreground">Descarga tus certificados completados.</p>
      </header>

      <section className="rounded-2xl border border-border bg-card/60 p-6" data-testid="certificates-list">
        {fetchError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
            <p className="text-sm font-semibold text-destructive">Error al cargar certificados</p>
            <p className="mt-1 text-xs text-muted-foreground">{fetchError}</p>
          </div>
        ) : certificates.length === 0 ? (
          <div className="py-8 text-center" data-testid="empty-state">
            <p className="text-sm text-muted-foreground">
              Aun no tienes certificados. Completa tus cursos para obtener tu primer certificado.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {certificates.map((certificate) => {
              const downloadUrl = getPdfDownloadUrl(certificate)
              return (
                <div key={certificate.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
                  <div className="text-sm font-semibold" data-testid="certificate-title">
                    {getCourseRunTitle(certificate)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground" data-testid="issue-date">
                    Emitido el {new Date(certificate.issued_at).toLocaleDateString('es-ES')}
                  </div>
                  {downloadUrl ? (
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block rounded-lg border border-border/60 px-4 py-2 text-xs"
                    >
                      Descargar
                    </a>
                  ) : (
                    <button
                      disabled
                      className="mt-3 rounded-lg border border-border/60 px-4 py-2 text-xs cursor-not-allowed opacity-50"
                    >
                      Descargar
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
