import Link from 'next/link'
import { ArrowUpRight, Building2, Layers3, ShieldCheck, Star } from 'lucide-react'

const trustSignals = [
  {
    icon: Star,
    label: 'Public learner feedback',
    detail: 'Five-star reviews presented by CEP Formación',
    href: 'https://cepformacion.akademate.com/',
  },
  {
    icon: ShieldCheck,
    label: 'Consent-first privacy',
    detail: 'No analytics or marketing before permission',
  },
  {
    icon: Building2,
    label: 'Every teaching model',
    detail: 'In-person, online and hybrid operations',
  },
  {
    icon: Layers3,
    label: 'One operating foundation',
    detail: 'Growth, campus, people and finance',
  },
] as const

export function TrustSignals() {
  return (
    <section
      aria-label="Akademate trust signals"
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
                <span className="text-sm font-semibold text-[#071633]">{label}</span>
              </div>
              <span className="mt-2 block text-xs leading-5 text-slate-500">{detail}</span>
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
                View source <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
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
