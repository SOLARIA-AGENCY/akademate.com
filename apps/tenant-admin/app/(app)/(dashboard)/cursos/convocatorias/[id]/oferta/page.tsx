import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button, PageHeader } from '@akademate/ui'

import { OfferConfigurationPage } from './OfferConfigurationPage'

export default async function CourseRunOfferPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <main className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <Button asChild variant="ghost" className="w-fit">
        <Link href="/cursos/convocatorias">
          <ArrowLeft data-icon="inline-start" aria-hidden="true" />
          Convocatorias
        </Link>
      </Button>
      <PageHeader
        eyebrow="Publicación y conversión"
        title="Configura cómo participa cada persona"
        description="Combina visibilidad, formulario, inscripción, aprobación, pago o enlace externo en cada convocatoria."
      />
      <OfferConfigurationPage courseRunId={id} />
    </main>
  )
}
