import Link from 'next/link'
import { Info, ShieldCheck, Sparkles, type LucideIcon } from 'lucide-react'
import { NON_CERTIFICATION_NOTICE, TRUST_NOTICES } from '@/lib/public-legal'

const icons: readonly LucideIcon[] = [ShieldCheck, Sparkles]

export function TrustNotices() {
  return (
    <aside aria-labelledby="trust-information" className="border-y bg-primary/[0.035]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h2
          id="trust-information"
          className="text-sm font-semibold uppercase tracking-[0.14em] text-primary"
        >
          Información de confianza
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {TRUST_NOTICES.map((notice, index) => {
            const Icon = icons[index] ?? Info
            return (
              <Link
                key={notice.href}
                href={notice.href}
                className="group flex min-h-24 items-start gap-4 rounded-xl border bg-background p-4 outline-none transition hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>
                  <span className="block font-semibold group-hover:text-primary">
                    {notice.label}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">{notice.detail}</span>
                </span>
              </Link>
            )
          })}
        </div>
        <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
          <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          {NON_CERTIFICATION_NOTICE}
        </p>
      </div>
    </aside>
  )
}
