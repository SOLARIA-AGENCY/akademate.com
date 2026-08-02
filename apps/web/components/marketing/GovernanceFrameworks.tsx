'use client'

import Link from 'next/link'
import {
  ArrowUpRight,
  BadgeCheck,
  BrainCircuit,
  ClipboardCheck,
  CodeXml,
  ShieldCheck,
} from 'lucide-react'
import { governanceFrameworks } from '@/lib/marketing-content'
import { useMarketingText } from '@/components/i18n/use-marketing-text'
import { useLocale } from '@/components/i18n/locale-provider'
import { localizedHref } from '@/lib/i18n/routing'

const frameworkIcons = {
  GDPR: ShieldCheck,
  'EU AI Act': BrainCircuit,
  'ISO 27001': ClipboardCheck,
  'SOC 2': BadgeCheck,
  OWASP: CodeXml,
} as const

export function GovernanceFrameworks() {
  const locale = useLocale()
  const t = useMarketingText()
  return (
    <section
      aria-labelledby="governance-title"
      className="bg-[#eff5ff] px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div>
            <p className="section-kicker">{t('Trust by design')}</p>
            <h2
              id="governance-title"
              className="mt-4 max-w-xl text-4xl font-semibold tracking-[-0.04em] text-[#071633] sm:text-5xl"
            >
              {t('Grow with confidence.')}
            </h2>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-slate-600">
            {t('Privacy, security and responsible AI belong inside the product.')}
          </p>
        </div>

        <div className="mt-10 grid border border-blue-200 md:grid-cols-5">
          {governanceFrameworks.map((framework) => {
            const Icon = frameworkIcons[framework.short]
            return (
              <article
                key={framework.short}
                className="border-b border-blue-200 p-6 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-200 bg-white text-blue-700 shadow-sm"
                  aria-label={`${framework.short} ${t('framework mark')}`}
                  title={`${framework.short} ${t('framework reference')}`}
                >
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="mt-5 text-sm font-bold text-blue-700">{framework.short}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {t('Governance reference')}
                </p>
                <h3 className="mt-3 font-semibold text-[#071633]">{t(framework.title)}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{t(framework.text)}</p>
              </article>
            )
          })}
        </div>

        <div className="mt-8 flex flex-col gap-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>{t('Framework references shaping our privacy, security and responsible AI roadmap.')}</p>
          <Link
            href={localizedHref('/legal/ia', locale)}
            className="inline-flex min-h-11 items-center gap-2 font-semibold text-blue-700 hover:text-blue-900"
          >
            {t('Explore responsible AI at Akademate')}{' '}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
