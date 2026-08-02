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
          'Depending on the contracted configuration, providers may support hosting, network security, storage, email, support, observability, payments or artificial intelligence.',
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
          'Según la configuración contratada, los proveedores pueden respaldar alojamiento, seguridad de red, almacenamiento, correo electrónico, soporte, observabilidad, pagos o inteligencia artificial.',
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
