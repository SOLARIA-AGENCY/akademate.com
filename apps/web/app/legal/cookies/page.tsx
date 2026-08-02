import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/LegalPage'
import { getLegalContent } from '@/lib/legal-config'
import { localizedAlternates } from '@/lib/i18n/routing'
import { getRequestLocale } from '@/lib/i18n/server'

const documents = {
  en: {
    title: 'Cookie policy',
    description: 'Current use of cookies and similar technologies on the Akademate public website.',
    sections: [
      { title: 'Current use', content: 'tracking-policy' },
      {
        title: 'Necessary technologies',
        content:
          'Authentication routes may use strictly necessary session cookies. The interface may also read a theme preference. These functions are not analytics or advertising.',
      },
      { title: 'Gate for future measurement', content: 'activation-gate' },
      {
        title: 'Browser controls',
        content:
          'Your browser can block or delete cookies. Disabling a strictly necessary cookie may prevent an authenticated session from working.',
      },
    ],
  },
  es: {
    title: 'Política de cookies',
    description:
      'Uso actual de cookies y tecnologías similares en el sitio web público de Akademate.',
    sections: [
      { title: 'Uso actual', content: 'tracking-policy' },
      {
        title: 'Tecnologías necesarias',
        content:
          'Las rutas de autenticación pueden utilizar cookies de sesión estrictamente necesarias. La interfaz también puede leer una preferencia de tema. Estas funciones no son analítica ni publicidad.',
      },
      { title: 'Condición para la medición futura', content: 'activation-gate' },
      {
        title: 'Controles del navegador',
        content:
          'Tu navegador puede bloquear o eliminar cookies. Desactivar una cookie estrictamente necesaria puede impedir que funcione una sesión autenticada.',
      },
    ],
  },
} as const

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const { title, description } = documents[locale]
  return { title, description, alternates: localizedAlternates('/legal/cookies') }
}

export default async function CookiesPage() {
  const locale = await getRequestLocale()
  const document = documents[locale]
  const trackingPolicy = getLegalContent(locale).trackingPolicy

  return (
    <LegalPage
      locale={locale}
      title={document.title}
      description={document.description}
      sections={document.sections.map((section) => ({
        title: section.title,
        content: (
          <p>
            {section.content === 'tracking-policy'
              ? trackingPolicy.statement
              : section.content === 'activation-gate'
                ? trackingPolicy.activationGate
                : section.content}
          </p>
        ),
      }))}
    />
  )
}
