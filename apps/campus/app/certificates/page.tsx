import { Award, CalendarDays, Download, ShieldCheck } from 'lucide-react'
import { cookies } from 'next/headers'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  PageHeader,
} from '@akademate/ui'

import { CampusWorkspace } from '../../components/CampusWorkspace'
import { certificateDownloadUrl, certificateTitle } from '../../lib/certificate-display'
import { fetchCertificates, type CertificateData } from '../../lib/api'

export const metadata = {
  title: 'Certificados - Campus',
}

export default async function CertificatesPage() {
  let certificates: CertificateData[] = []
  let fetchError = false

  try {
    const cookieStore = await cookies()
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join('; ')

    const result = await fetchCertificates({ cookie: cookieHeader })
    certificates = result.docs
  } catch {
    fetchError = true
  }

  return (
    <CampusWorkspace activePath="/certificates">
      <main className="space-y-6" data-testid="certificates-page">
        <PageHeader
          eyebrow="Historial académico"
          title="Certificados"
          description="Documentos emitidos para cursos completados."
        />

        {fetchError ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudieron cargar los certificados</AlertTitle>
            <AlertDescription>
              Vuelve a intentarlo más tarde o contacta con tu academia.
            </AlertDescription>
          </Alert>
        ) : (
          <Card data-testid="certificates-list">
            <CardContent className="pt-6">
              {certificates.length === 0 ? (
                <EmptyState
                  title="Sin certificados emitidos"
                  description="Los certificados aparecerán aquí cuando tu academia complete su emisión."
                  icon={<Award className="size-5" />}
                />
              ) : (
                <div className="divide-y divide-border">
                  {certificates.map((certificate) => {
                    const downloadUrl = certificateDownloadUrl(certificate)
                    return (
                      <article
                        key={certificate.id}
                        className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2
                              className="truncate text-sm font-semibold"
                              data-testid="certificate-title"
                            >
                              {certificateTitle(certificate)}
                            </h2>
                            <Badge variant="outline">{certificate.certificate_number}</Badge>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span
                              className="inline-flex items-center gap-1"
                              data-testid="issue-date"
                            >
                              <CalendarDays className="size-3.5" aria-hidden="true" />
                              Emitido el{' '}
                              {new Date(certificate.issued_at).toLocaleDateString('es-ES')}
                            </span>
                            <span className="inline-flex items-center gap-1 break-all">
                              <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />
                              {certificate.verification_code}
                            </span>
                          </div>
                        </div>
                        {downloadUrl ? (
                          <Button asChild variant="outline" size="sm">
                            <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="size-4" aria-hidden="true" />
                              Descargar
                            </a>
                          </Button>
                        ) : (
                          <Button disabled variant="outline" size="sm">
                            PDF no disponible
                          </Button>
                        )}
                      </article>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </CampusWorkspace>
  )
}
