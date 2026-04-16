import { notFound } from 'next/navigation'
import { WebsiteRenderer } from '../../_components/WebsiteRenderer'
import { getPublicPage, getTenantWebsite } from '@/app/lib/website/server'
import type { WebsitePage, WebsiteSection } from '@/app/lib/website/types'

export const dynamic = 'force-dynamic'

const CEP_FEATURE_STRIP_OVERRIDE: Extract<WebsiteSection, { kind: 'featureStrip' }> = {
  kind: 'featureStrip',
  title: 'Por qué CEP',
  subtitle: 'Mismo tono de marca, estructura más mantenible.',
  items: [
    {
      title: 'Prácticas reales',
      description: 'Programas conectados con empresas y entorno profesional.',
    },
    {
      title: 'Oferta mixta',
      description: 'Ciclos oficiales, cursos privados y formación subvencionada.',
    },
    {
      title: 'Sedes activas',
      description: 'Presencia física en Tenerife con atención académica continua.',
    },
  ],
}

function applyCepHomeOverrides(page: WebsitePage): WebsitePage {
  const sections = Array.isArray(page.sections) ? [...page.sections] : []
  const featureStripIndex = sections.findIndex(
    (section) => section?.kind === 'featureStrip'
  )

  if (featureStripIndex >= 0) {
    const existingSection = sections[featureStripIndex]
    if (existingSection?.kind === 'featureStrip') {
      sections[featureStripIndex] = {
        ...existingSection,
        ...CEP_FEATURE_STRIP_OVERRIDE,
      }
    }
  } else {
    sections.splice(2, 0, CEP_FEATURE_STRIP_OVERRIDE)
  }

  return {
    ...page,
    sections,
  }
}

export default async function FormacionLandingPage() {
  const website = await getTenantWebsite()
  const page = await getPublicPage('/')

  if (!page) notFound()

  const normalizedPage = applyCepHomeOverrides(page)
  return <WebsiteRenderer page={normalizedPage} brandColor={website.visualIdentity.colorPrimary} />
}
