import type { ReactNode } from 'react'
import Link from 'next/link'

type HeroAction = {
  href: string
  label: string
  variant?: 'primary' | 'secondary'
}

type PublicPageHeroProps = {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  imageSrc: string
  imageAlt: string
  actions?: HeroAction[]
}

export function PublicPageHero({
  eyebrow,
  title,
  description,
  imageSrc,
  imageAlt,
  actions = [],
}: PublicPageHeroProps) {
  return (
    <section className="relative isolate min-h-[420px] overflow-hidden bg-slate-950 text-white sm:min-h-[480px]">
      <img
        src={imageSrc}
        alt={imageAlt}
        className="absolute inset-0 h-full w-full object-cover object-center"
        fetchPriority="high"
        decoding="async"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-slate-950/15"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-slate-950/10"
        aria-hidden="true"
      />
      <div className="relative mx-auto flex min-h-[420px] max-w-7xl items-center px-4 py-20 sm:min-h-[480px] sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="text-sm font-black uppercase tracking-[0.28em] text-rose-200">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-white sm:text-6xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80 sm:text-xl">
              {description}
            </p>
          ) : null}
          {actions.length > 0 ? (
            <div className="mt-8 flex flex-wrap gap-3">
              {actions.map((action) => (
                <Link
                  key={`${action.href}-${action.label}`}
                  href={action.href}
                  className={
                    action.variant === 'secondary'
                      ? 'inline-flex min-h-12 items-center justify-center rounded-full border border-white/30 bg-white/10 px-6 text-sm font-black text-white transition hover:bg-white/20'
                      : 'inline-flex min-h-12 items-center justify-center rounded-full bg-[#f2014b] px-6 text-sm font-black text-white transition hover:bg-[#d0013f]'
                  }
                >
                  {action.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
