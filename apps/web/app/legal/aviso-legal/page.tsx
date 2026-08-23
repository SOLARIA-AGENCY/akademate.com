import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/LegalPage'
import { getLegalContent } from '@/lib/legal-config'
import { publicPageMetadata } from '@/lib/i18n/metadata'
import { getRequestLocale } from '@/lib/i18n/server'

const documents = {
  en: {
    title: 'Legal notice',
    description:
      'Identifying information for the provider of akademate.com. Registry, tax and address details will be completed after documentary validation.',
    sections: [
      {
        title: 'Provider',
        content:
          ' operates Akademate and this public website. The company name is published below. Registry code, VAT identifier and registered office will be added here once they have been documentarily validated. They are not invented for publication.',
      },
      {
        title: 'Purpose of this website',
        content:
          'akademate.com is the public information site for the Akademate service. Product descriptions, plans and examples on this site do not by themselves constitute a contract.',
      },
      {
        title: 'Contact',
        content:
          'Until a dedicated legal channel is validated, enquiries may be sent to info@akademate.com.',
      },
      {
        title: 'Intellectual property',
        content:
          'The Akademate name, product interface and site content are subject to applicable intellectual-property rights. Unauthorised use is not permitted.',
      },
      {
        title: 'To be completed by counsel',
        content:
          'Governing law, venue, additional LSSI/e-commerce disclosures and any other statutory statements required for the public site will be published here after professional legal review. This page is a structured stub ready to fill — not a substitute for that review.',
      },
    ],
  },
  es: {
    title: 'Aviso legal',
    description:
      'Información identificativa del prestador de akademate.com. Los datos registrales, fiscales y de domicilio se completarán tras la validación documental.',
    sections: [
      {
        title: 'Prestador',
        content:
          ' opera Akademate y este sitio web público. La denominación social figura más abajo. El código registral, el identificador de IVA y el domicilio social se añadirán aquí cuando hayan sido validados documentalmente. No se inventan para su publicación.',
      },
      {
        title: 'Finalidad de este sitio',
        content:
          'akademate.com es el sitio de información pública del servicio Akademate. Las descripciones de producto, planes y ejemplos de este sitio no constituyen por sí solos un contrato.',
      },
      {
        title: 'Contacto',
        content:
          'Hasta que se valide un canal jurídico específico, las consultas pueden enviarse a info@akademate.com.',
      },
      {
        title: 'Propiedad intelectual',
        content:
          'El nombre Akademate, la interfaz de producto y el contenido del sitio están sujetos a los derechos de propiedad intelectual aplicables. No se permite un uso no autorizado.',
      },
      {
        title: 'Pendiente de redacción profesional',
        content:
          'La ley aplicable, el fuero, las menciones adicionales LSSI/comercio electrónico y cualquier otro dato preceptivo se publicarán aquí tras la revisión jurídica profesional. Esta página es un stub estructurado listo para rellenar, no un sustituto de esa revisión.',
      },
    ],
  },
} as const

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  return publicPageMetadata({
    locale,
    pathname: '/legal/aviso-legal',
    copy: { en: documents.en, es: documents.es },
  })
}

export default async function LegalNoticePage() {
  const locale = await getRequestLocale()
  const document = documents[locale]
  const company = getLegalContent(locale).company
  return (
    <LegalPage
      locale={locale}
      title={document.title}
      description={document.description}
      sections={document.sections.map((section, index) => ({
        title: section.title,
        content: <p>{index === 0 ? `${company.name}${section.content}` : section.content}</p>,
      }))}
    />
  )
}
