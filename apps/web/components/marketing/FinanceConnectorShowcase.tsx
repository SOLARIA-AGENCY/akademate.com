import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Landmark } from 'lucide-react'

import { financeConnectors, type PublicConnectorStatus } from '@/lib/integration-availability'
import { localizedHref, type Locale } from '@/lib/i18n/routing'

const statusCopy: Record<PublicConnectorStatus, { en: string; es: string }> = {
  'coming-soon': { en: 'Coming soon', es: 'Próximamente' },
  available: { en: 'Available', es: 'Disponible' },
  'custom-request': { en: 'Request a connector', es: 'Solicitar integración' },
}

const copy = {
  en: {
    eyebrow: 'Connected finance',
    title: 'Connect academy finance.',
    text: 'Payments, invoices and reconciliation in one view.',
    path: 'View path',
  },
  es: {
    eyebrow: 'Finanzas conectadas',
    title: 'Conecta las finanzas.',
    text: 'Pagos, facturas y conciliación en una sola vista.',
    path: 'Ver recorrido',
  },
} as const

export function FinanceConnectorShowcase({
  locale = 'en',
  imageSrc = '/images/marketing/akademate-finance-connection-flow-v1.png',
  imageAlt = 'Illustrative finance connection workflow',
}: {
  locale?: Locale
  imageSrc?: string
  imageAlt?: string
}) {
  const strings = copy[locale]

  return (
    <section
      aria-labelledby="finance-connectors-title"
      className="border-y border-blue-200 bg-[#eef4ff] px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-blue-700">{strings.eyebrow}</p>
          <h2
            id="finance-connectors-title"
            className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl"
          >
            {strings.title}
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">{strings.text}</p>
        </div>
        <div className="relative mt-10 aspect-[4/3] overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 1024px) 100vw, 1200px"
            className="object-cover"
          />
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {financeConnectors.map((connector) => (
            <article
              key={connector.id}
              className="flex min-h-48 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    {connector.logoId ? (
                      <Image
                        src={`/brands/${connector.logoId}.svg`}
                        alt=""
                        width={22}
                        height={22}
                      />
                    ) : (
                      <Landmark className="h-5 w-5" aria-hidden="true" />
                    )}
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    {statusCopy[connector.status][locale]}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-[#071633]">{connector.name}</h3>
              </div>
              <Link
                href={localizedHref(connector.ctaPath, locale)}
                className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-blue-700"
              >
                {connector.status === 'custom-request'
                  ? statusCopy[connector.status][locale]
                  : strings.path}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
