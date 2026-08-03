import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button, PageHeader } from '@akademate/ui'

import { OfferSubmissionInbox } from './OfferSubmissionInbox'

export default function OfferSubmissionsPage() {
  return (
    <main className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <Button asChild variant="ghost" className="w-fit">
        <Link href="/cursos/convocatorias">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Convocatorias
        </Link>
      </Button>
      <PageHeader
        eyebrow="Captación y matrículas"
        title="Solicitudes de cursos"
        description="Revisa consultas, candidaturas e inscripciones solicitadas desde las páginas públicas de tu academia."
      />
      <OfferSubmissionInbox />
    </main>
  )
}
