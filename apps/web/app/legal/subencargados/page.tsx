import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/LegalPage'
import { publicPageMetadata } from '@/lib/i18n/metadata'
import { getRequestLocale } from '@/lib/i18n/server'

const documents = {
  en: {
    title: 'Subprocessors and providers',
    description: 'Information about provider categories that may support delivery of Akademate.',
    sections: [
      {
        title: 'Provider inventory',
        content:
          'The contractual list of providers, locations, transfers and functions is being validated before final publication. A dependency in source code does not by itself establish that a provider processes customer data.',
      },
      {
        title: 'Provider categories',
        content:
          'Brik64 LLC currently uses Cloudflare to host and deliver the public website. After analytics consent, the public website may load Google Tag Manager and Google Analytics 4; they are not advertising tags. Depending on the contracted product configuration, other providers may support hosting, network security, storage, email, support, observability, payments or artificial intelligence. A dependency in source code does not by itself establish that a provider processes customer data.',
      },
      {
        title: 'Changes and safeguards',
        content:
          'Where a provider processes data for a customer, its function, location and safeguards should appear in the applicable contract or annex together with the agreed change-notification mechanism.',
      },
      {
        title: 'Requesting information',
        content:
          'Customers may request the current contractual inventory through their Akademate relationship channel.',
      },
    ],
  },
  es: {
    title: 'Subencargados y proveedores',
    description:
      'Información sobre las categorías de proveedores que pueden respaldar la prestación de Akademate.',
    sections: [
      {
        title: 'Inventario de proveedores',
        content:
          'La lista contractual de proveedores, ubicaciones, transferencias y funciones se está validando antes de la publicación final. Una dependencia en el código fuente no establece por sí misma que un proveedor trate datos de clientes.',
      },
      {
        title: 'Categorías de proveedores',
        content:
          'Brik64 LLC usa Cloudflare para alojar y entregar el sitio público. Tras el consentimiento de analítica, el sitio puede cargar Google Tag Manager y Google Analytics 4; no son etiquetas publicitarias. Según la configuración contratada del producto, otros proveedores pueden respaldar alojamiento, seguridad de red, almacenamiento, correo electrónico, soporte, observabilidad, pagos o inteligencia artificial. Una dependencia en el código no establece por sí misma que un proveedor trate datos de clientes.',
      },
      {
        title: 'Cambios y salvaguardas',
        content:
          'Cuando un proveedor trate datos para un cliente, su función, ubicación y salvaguardas deben figurar en el contrato o anexo aplicable, junto con el mecanismo de notificación de cambios acordado.',
      },
      {
        title: 'Solicitud de información',
        content:
          'Los clientes pueden solicitar el inventario contractual vigente a través de su canal de relación con Akademate.',
      },
    ],
  },
} as const

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  return publicPageMetadata({
    locale,
    pathname: '/legal/subencargados',
    copy: { en: documents.en, es: documents.es },
  })
}

export default async function SubprocessorsPage() {
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
