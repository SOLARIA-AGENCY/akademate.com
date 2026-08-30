import Link from 'next/link'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function OfferCancelPage({ params }: Props) {
  const { slug } = await params
  return (
    <main className="public-site mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-semibold">Pago cancelado</h1>
      <p className="mt-3 text-neutral-600">No se ha cobrado nada. Puedes volver a la oferta e intentarlo de nuevo.</p>
      <Link href={`/p/ofertas/${slug}`} className="mt-6 text-sm font-medium underline">
        Volver a la oferta
      </Link>
    </main>
  )
}
