import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { PublicPageHero } from '../_components/PublicPageHero'
import { CEP_PUBLIC_HERO_ASSETS } from '../_components/public-hero-assets'

export const dynamic = 'force-dynamic'

function extractPlainText(node: any): string {
  if (!node) return ''
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(extractPlainText).join(' ')
  if (typeof node === 'object') {
    return [node.text, extractPlainText(node.children)].filter(Boolean).join(' ')
  }
  return ''
}

export default async function FaqIndexPage() {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'faqs',
    where: { status: { equals: 'published' } },
    sort: 'order',
    limit: 50,
    depth: 0,
  })

  return (
    <div>
      <PublicPageHero
        eyebrow="Te acompañamos antes de matricularte"
        title="Preguntas frecuentes"
        description="Resuelve tus dudas sobre matrícula, oferta formativa, modalidades y el funcionamiento de CEP Formación."
        imageSrc={CEP_PUBLIC_HERO_ASSETS.orientacion}
        imageAlt="Asesora orientando a una estudiante"
        actions={[{ href: '/contacto', label: 'Hablar con orientación' }]}
      />
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="space-y-4">
        {result.docs.map((faq: any) => (
          <details key={faq.id} className="rounded-2xl border border-slate-200 bg-white p-6">
            <summary className="cursor-pointer text-lg font-semibold text-slate-950">{faq.question}</summary>
            <p className="mt-4 text-sm leading-7 text-slate-600">{extractPlainText(faq.answer) || 'Respuesta disponible próximamente.'}</p>
          </details>
        ))}
      </div>
      </div>
    </div>
  )
}
