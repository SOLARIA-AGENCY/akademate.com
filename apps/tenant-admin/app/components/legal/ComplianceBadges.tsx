import Image from 'next/image'
import Link from 'next/link'

const COMPLIANCE_MARKS = [
  {
    key: 'rgpd',
    hrefKey: 'privacyHref' as const,
    src: '/website/cep/logos/compliance/gdpr-logo.png',
    alt: 'RGPD',
    ariaLabel: 'Privacidad y RGPD',
    width: 2000,
    height: 2000,
    className: 'h-16 w-16 brightness-0',
  },
  {
    key: 'ai-act',
    hrefKey: 'aiHref' as const,
    src: '/website/cep/logos/compliance/eu-ai-act.png',
    alt: 'EU Artificial Intelligence Act',
    ariaLabel: 'Transparencia y AI Act',
    width: 846,
    height: 215,
    className: 'h-12 w-auto max-w-[12rem]',
  },
] as const

export function ComplianceBadges({
  privacyHref = '/p/legal/privacidad',
  aiHref = '/p/legal/ia',
  className = '',
}: {
  privacyHref?: string
  aiHref?: string
  className?: string
}) {
  const hrefs = { privacyHref, aiHref }

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-5 lg:justify-end ${className}`.trim()}
      aria-label="Información regulatoria"
    >
      {COMPLIANCE_MARKS.map((mark) => (
        <Link
          key={mark.key}
          href={hrefs[mark.hrefKey]}
          className="inline-flex rounded-md p-1 opacity-80 transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
          aria-label={mark.ariaLabel}
          title="Información regulatoria; no constituye certificación"
        >
          <Image
            src={mark.src}
            alt={mark.alt}
            width={mark.width}
            height={mark.height}
            className={`${mark.className} object-contain`}
          />
        </Link>
      ))}
      <span className="sr-only">Información regulatoria; no constituye certificación.</span>
    </div>
  )
}
