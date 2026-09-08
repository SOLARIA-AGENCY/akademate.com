import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/LegalPage'
import { localizedAlternates } from '@/lib/i18n/routing'
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
          'Brik64 LLC, a Delaware limited liability company doing business as Brik64 Inc., acts as controller for the Akademate website, commercial relationship, billing and security. Akademate is the product name. For data an academy enters into Akademate, controller and processor responsibilities depend on the relevant processing activity and contract.',
      },
      {
        title: 'Data and purposes',
        content:
          'The website may receive contact details and context supplied with an enquiry. The service may process account, academic-operation, billing and security data for the purposes agreed with the organisation. Customer data is not described here as training data for general-purpose models.',
      },
      {
        title: 'Legal bases and retention',
        content:
          'For visitors and customers in the European Economic Area, the United Kingdom or Switzerland, GDPR and UK GDPR principles apply, including consent, pre-contractual steps, contract, legal obligation or an assessed legitimate interest. Retention periods must be determined for each activity.',
      },
      {
        title: 'EU representative',
        content:
          'An Article 27 EU representative, if required, will be published here after documentary validation. No representative address is listed until that validation is complete.',
      },
      {
        title: 'US state privacy rights',
        content:
          'Depending on your US state of residence, you may have rights to know, access, correct, delete or opt out of certain processing of personal information, including under the California CCPA/CPRA and similar state laws. This section describes available rights; it does not claim a completed certification or audit. Requests may be sent to info@akademate.com.',
      },
      {
        title: 'Rights and contact',
        content:
          'Requests about data managed by an academy should normally be directed to that organisation. Until a dedicated privacy channel is validated, enquiries for Brik64 LLC may be sent to info@akademate.com.',
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
          'Brik64 LLC, una limited liability company de Delaware que opera como Brik64 Inc., actúa como responsable del sitio web de Akademate, la relación comercial, la facturación y la seguridad. Akademate es el nombre del producto. Para los datos que una academia introduce en Akademate, las responsabilidades de responsable y encargado dependen de la actividad de tratamiento y el contrato aplicables.',
      },
      {
        title: 'Datos y finalidades',
        content:
          'El sitio web puede recibir datos de contacto y contexto suministrados en una consulta. El servicio puede tratar datos de cuenta, operación académica, facturación y seguridad para las finalidades acordadas con la organización. Los datos de clientes no se describen aquí como datos de entrenamiento para modelos de propósito general.',
      },
      {
        title: 'Bases jurídicas y conservación',
        content:
          'Para visitantes y clientes del Espacio Económico Europeo, el Reino Unido o Suiza se aplican los principios del RGPD y del UK GDPR, incluidos el consentimiento, las medidas precontractuales, el contrato, la obligación legal o un interés legítimo evaluado. Los plazos de conservación deben determinarse para cada actividad.',
      },
      {
        title: 'Representante en la UE',
        content:
          'Un representante en la UE conforme al artículo 27, si resulta exigible, se publicará aquí tras la validación documental. No se indica dirección de representante hasta completar esa validación.',
      },
      {
        title: 'Derechos de privacidad en estados de EE. UU.',
        content:
          'Según tu estado de residencia en EE. UU., puedes tener derechos a conocer, acceder, corregir, eliminar u oponerte a determinados tratamientos, incluidos el CCPA/CPRA de California y leyes estatales similares. Esta sección describe derechos disponibles; no afirma una certificación o auditoría completada. Las solicitudes pueden enviarse a info@akademate.com.',
      },
      {
        title: 'Derechos y contacto',
        content:
          'Las solicitudes sobre datos gestionados por una academia deben dirigirse normalmente a esa organización. Hasta que se valide un canal específico de privacidad, las consultas para Brik64 LLC pueden enviarse a info@akademate.com.',
      },
    ],
  },
} as const

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const { title, description } = documents[locale]
  return { title, description, alternates: localizedAlternates('/legal/privacidad') }
}

export default async function PrivacyPage() {
  const locale = await getRequestLocale()
  const document = documents[locale]
  return (
    <LegalPage
      locale={locale}
      title={document.title}
      description={document.description}
      sections={document.sections.map((section) => ({
        title: section.title,
        content: <p>{section.content}</p>,
      }))}
    />
  )
}
