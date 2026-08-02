import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/LegalPage'
import { localizedAlternates } from '@/lib/i18n/routing'
import { getRequestLocale } from '@/lib/i18n/server'

const documents = {
  en: {
    title: 'AI transparency',
    description:
      'How AI-assisted tools, human oversight and data boundaries are approached in Akademate.',
    sections: [
      {
        title: 'AI-assisted operations',
        content:
          'Akademate can connect AI-assisted tools to operational workflows through governed interfaces, including MCP. Available tools, providers, credentials and accessible data are determined by the organisation’s deployment and authorisation model.',
      },
      {
        title: 'Human oversight',
        content:
          'AI output can be incomplete or inaccurate. Meaningful educational, legal, financial or high-impact decisions require appropriate human review.',
      },
      {
        title: 'Data and permissions',
        content:
          'Each integration must remain within the authorised organisation, role, resource and purpose. External providers require the relevant contractual, data-flow and configuration review.',
      },
      {
        title: 'Frameworks shaping our approach',
        content:
          'Our governance roadmap draws on GDPR, the EU AI Act, ISO 27001, SOC 2 and modern application security practices. Evidence for completed certifications or independent audits will be published in this trust centre as it becomes available.',
      },
    ],
  },
  es: {
    title: 'Transparencia de IA',
    description:
      'Cómo aborda Akademate las herramientas asistidas por IA, la supervisión humana y los límites de datos.',
    sections: [
      {
        title: 'Operaciones asistidas por IA',
        content:
          'Akademate puede conectar herramientas asistidas por IA con flujos de trabajo operativos mediante interfaces gobernadas, incluido MCP. Las herramientas, proveedores, credenciales y datos accesibles disponibles dependen del modelo de despliegue y autorización de la organización.',
      },
      {
        title: 'Supervisión humana',
        content:
          'La salida de IA puede ser incompleta o inexacta. Las decisiones educativas, legales, financieras o de alto impacto relevantes requieren una revisión humana adecuada.',
      },
      {
        title: 'Datos y permisos',
        content:
          'Cada integración debe mantenerse dentro de la organización, rol, recurso y finalidad autorizados. Los proveedores externos requieren la revisión contractual, de flujo de datos y de configuración pertinente.',
      },
      {
        title: 'Marcos que orientan nuestro enfoque',
        content:
          'Nuestra hoja de ruta de gobierno toma como referencia el RGPD, la Ley de IA de la UE, ISO 27001, SOC 2 y prácticas modernas de seguridad de aplicaciones. La evidencia de certificaciones completadas o auditorías independientes se publicará en este centro de confianza cuando esté disponible.',
      },
    ],
  },
} as const

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const { title, description } = documents[locale]
  return { title, description, alternates: localizedAlternates('/legal/ia', locale) }
}

export default async function AiTransparencyPage() {
  const locale = await getRequestLocale()
  const document = documents[locale]
  return (
    <LegalPage
      locale={locale}
      title={document.title}
      description={document.description}
      sections={document.sections.map((section) => ({ ...section, content: <p>{section.content}</p> }))}
    />
  )
}
