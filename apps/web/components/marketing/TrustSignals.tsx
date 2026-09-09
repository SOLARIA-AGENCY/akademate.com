'use client'

import Link from 'next/link'
import { ArrowUpRight, Building2, Layers3, ShieldCheck, Star } from 'lucide-react'
import { useMarketingText } from '@/components/i18n/use-marketing-text'

const trustSignals = [
  {
    icon: Star,
    label: 'Learner-rated experience',
    detail: 'See public feedback from a live Akademate academy',
    href: 'https://cepformacion.akademate.com/',
  },
  {
    icon: ShieldCheck,
    label: 'Consent-aware enquiries',
    detail: 'Clear privacy choices before people share their details',
  },
  {
    icon: Building2,
    label: 'Built for every classroom',
    detail: 'One flow for in-person, online and hybrid delivery',
  },
  {
    icon: Layers3,
    label: 'Configure your operating stack',
    detail: 'Activate the modules, roles and integrations you need',
  },
] as const

export function TrustSignals() {
  const t = useMarketingText()
  return (
    <section
      aria-label={t('Akademate trust signals')}
      className="border-b border-slate-200 bg-[#f8faff] px-4 sm:px-6 lg:px-8"
    >
      <div className="mx-auto grid max-w-7xl border-x border-slate-200 sm:grid-cols-2 lg:grid-cols-4">
        {trustSignals.map(({ icon: Icon, label, detail, ...signal }, index) => {
          const content = (
            <>
              <div className="flex items-center gap-2 text-blue-700">
                <Icon
                  className={`h-5 w-5 ${index === 0 ? 'fill-amber-400 text-amber-400' : ''}`}
                  aria-hidden="true"
                />
                <span className="text-sm font-semibold text-[#071633]">{t(label)}</span>
              </div>
              <span className="mt-2 block text-xs leading-5 text-slate-500">{t(detail)}</span>
            </>
          )
          const className =
            'block border-b border-slate-200 p-5 transition last:border-b-0 sm:border-r lg:border-b-0 lg:last:border-r-0'
          return 'href' in signal ? (
            <Link
              key={label}
              href={signal.href}
              target="_blank"
              rel="noreferrer"
              className={`${className} hover:bg-white`}
            >
              {content}
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
                {t('View source')} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </Link>
          ) : (
            <div key={label} className={className}>
              {content}
            </div>
          )
        })}
      </div>
    </section>
  )
}
