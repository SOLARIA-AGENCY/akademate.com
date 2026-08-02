import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/LegalPage'
import { getLegalContent } from '@/lib/legal-config'
import { publicPageMetadata } from '@/lib/i18n/metadata'
import { getRequestLocale } from '@/lib/i18n/server'

const documents = {
  en: {
    title: 'Privacy policy',
    description:
      'Information about personal data associated with the Akademate corporate website and service.',
    sections: [
      {
        title: 'Who processes data',
        content:
          ' acts as controller for its website, commercial relationship, billing and security. For data an academy enters into Akademate, controller and processor responsibilities depend on the relevant processing activity and contract.',
      },
      {
        title: 'Data and purposes',
        content:
          'The website may receive contact details and context supplied with an enquiry. The service may process account, academic-operation, billing and security data for the purposes agreed with the organisation. Customer data is not described here as training data for general-purpose models.',
      },
      {
        title: 'Legal bases and retention',
        content:
          'Applicable bases and retention periods must be determined for each activity, including consent, pre-contractual steps, contract, legal obligation or an assessed legitimate interest.',
      },
      {
        title: 'Rights and contact',
        content:
          'Requests about data managed by an academy should normally be directed to that organisation. Until a dedicated privacy channel is validated, enquiries for SOLARIA may be sent to info@akademate.com.',
      },
    ],
  },
  es: {
    title: 'Política de privacidad',
    description:
      'Información sobre los datos personales asociados al sitio web corporativo y al servicio de Akademate.',
    sections: [
      {
        title: 'Quién trata los datos',
        content:
          ' actúa como responsable de su sitio web, relación comercial, facturación y seguridad. Para los datos que una academia introduce en Akademate, las responsabilidades de responsable y encargado dependen de la actividad de tratamiento y el contrato aplicables.',
      },
      {
        title: 'Datos y finalidades',
        content:
          'El sitio web puede recibir datos de contacto y contexto suministrados en una consulta. El servicio puede tratar datos de cuenta, operación académica, facturación y seguridad para las finalidades acordadas con la organización. Los datos de clientes no se describen aquí como datos de entrenamiento para modelos de propósito general.',
      },
      {
        title: 'Bases jurídicas y conservación',
        content:
          'Las bases aplicables y los plazos de conservación deben determinarse para cada actividad, incluidos el consentimiento, las medidas precontractuales, el contrato, la obligación legal o un interés legítimo evaluado.',
      },
      {
        title: 'Derechos y contacto',
        content:
          'Las solicitudes sobre datos gestionados por una academia deben dirigirse normalmente a esa organización. Hasta que se valide un canal específico de privacidad, las consultas para SOLARIA pueden enviarse a info@akademate.com.',
      },
    ],
  },
} as const

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  return publicPageMetadata({
    locale,
    pathname: '/legal/privacidad',
    copy: { en: documents.en, es: documents.es },
  })
}

export default async function PrivacyPage() {
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
