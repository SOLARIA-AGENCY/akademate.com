import Image from 'next/image'
import Link from 'next/link'
import { ComplianceBadges } from '@/components/legal/ComplianceBadges'
import { legalLinks } from '@/lib/legal-config'
import { publicCompanyLinks, publicSocialLinks } from '@/lib/public-navigation'

const productLinks = [
  { name: 'Features', href: '/features' },
  { name: 'Reservations', href: '/#reservations' },
  { name: "Who it's for", href: '/solutions' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Download apps', href: '/download' },
] as const

export function Footer() {
  return (
    <footer className="bg-[#050f24] text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/logos/akademate-icon-48.png" alt="" width={34} height={34} />
              <span className="text-sm font-extrabold tracking-[0.12em]">AKADEMATE</span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-7 text-blue-100/65">
              Turn demand into enrolment, programmes into standout experiences and everyday
              operations into lasting growth.
            </p>
            <div className="mt-6 flex items-center gap-2" aria-label="Akademate social media">
              {publicSocialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${link.name}: find Akademate`}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[.06] text-blue-100/70 transition hover:border-blue-300/40 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                >
                  {link.name === 'Instagram' ? (
                    <InstagramMark />
                  ) : link.name === 'Facebook' ? (
                    <FacebookMark />
                  ) : (
                    <XMark />
                  )}
                </a>
              ))}
            </div>
          </div>
          <FooterColumn title="Product" links={productLinks} />
          <FooterColumn title="Company" links={publicCompanyLinks} />
          <div>
            <FooterColumn
              title="Legal"
              links={legalLinks.map(({ title, href }) => ({ name: title, href }))}
            />
            <a
              className="mt-5 inline-block text-sm text-blue-200 hover:text-white"
              href="mailto:info@akademate.com"
            >
              info@akademate.com
            </a>
          </div>
        </div>

        <div className="mt-14 grid gap-8 border-t border-white/10 pt-9 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="max-w-xl text-2xl font-semibold tracking-tight">
              Run a better academy. Create a better experience for everyone in it.
            </p>
            <p className="mt-3 text-sm text-blue-100/50">
              Akademate brings growth, operations, learning and finance into one connected rhythm.
            </p>
          </div>
          <ComplianceBadges />
        </div>
        <div>
          <div className="mt-8 flex flex-col gap-2 text-center text-xs leading-5 text-blue-100/45 sm:flex-row sm:justify-between sm:text-left">
            <p>© {new Date().getFullYear()} Akademate. All rights reserved.</p>
            <p>Legal information is maintained as part of our product governance programme.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: readonly { name: string; href: string }[]
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-blue-100/60 hover:text-white">
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function XMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817-5.965 6.817H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  )
}

function InstagramMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function FacebookMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-8h2.75l.41-3H13.5V8.08c0-.87.24-1.46 1.58-1.46h1.69V3.94a22.8 22.8 0 0 0-2.46-.13c-2.43 0-4.1 1.48-4.1 4.21V10H7.46v3h2.75v8h3.29Z" />
    </svg>
  )
}
