import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/LegalPage'
import { localizedAlternates } from '@/lib/i18n/routing'
import { getRequestLocale } from '@/lib/i18n/server'

const documents = {
  en: {
    title: 'Terms of use',
    description:
      'Information governing access to this website and the relationship between public product information and a service agreement.',
    sections: [
      {
        title: 'Website and service agreements',
        content:
          'akademate.com describes Akademate and its Business and Enterprise plans. Modules, deployment, support, availability, price, limits, integrations and responsibilities become binding only through the applicable proposal or contract.',
      },
      {
        title: 'Authorised use',
        content:
          'You must not interfere with security, access another organisation’s data, abuse forms or use the service for unlawful purposes. Credentials must be protected.',
      },
      {
        title: 'Availability and changes',
        content:
          'Website information may be updated as the product and commercial offering evolve. Service-level commitments, where applicable, belong in the relevant agreement.',
      },
      {
        title: 'Ownership and responsibility',
        content:
          'Akademate and its components are subject to applicable intellectual-property rights. Each customer retains its rights and responsibilities concerning its data. Contractual liability terms require legal review and agreement.',
      },
    ],
  },
  es: {
    title: 'Términos de uso',
    description:
      'Información que regula el acceso a este sitio web y la relación entre la información pública de producto y un contrato de servicio.',
    sections: [
      {
        title: 'Sitio web y contratos de servicio',
        content:
          'akademate.com describe Akademate y sus planes Business y Enterprise. Los módulos, despliegue, soporte, disponibilidad, precio, límites, integraciones y responsabilidades solo serán vinculantes mediante la propuesta o contrato aplicable.',
      },
      {
        title: 'Uso autorizado',
        content:
          'No debes interferir con la seguridad, acceder a los datos de otra organización, hacer un uso abusivo de formularios ni utilizar el servicio con fines ilícitos. Las credenciales deben protegerse.',
      },
      {
        title: 'Disponibilidad y cambios',
        content:
          'La información del sitio web puede actualizarse a medida que evolucionan el producto y la oferta comercial. Los compromisos de nivel de servicio, cuando existan, pertenecen al acuerdo correspondiente.',
      },
      {
        title: 'Titularidad y responsabilidad',
        content:
          'Akademate y sus componentes están sujetos a los derechos de propiedad intelectual aplicables. Cada cliente conserva sus derechos y responsabilidades respecto a sus datos. Los términos de responsabilidad contractual requieren revisión y acuerdo legal.',
      },
    ],
  },
} as const

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const { title, description } = documents[locale]
  return { title, description, alternates: localizedAlternates('/legal/terminos', locale) }
}

export default async function TermsPage() {
  const locale = await getRequestLocale()
  const document = documents[locale]
  return (
    <LegalPage
      locale={locale}
      title={document.title}
      description={document.description}
      sections={document.sections.map((section) => ({
        ...section,
        content: <p>{section.content}</p>,
      }))}
    />
  )
}
