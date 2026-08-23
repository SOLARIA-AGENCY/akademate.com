import Image from 'next/image'
import Link from 'next/link'
import { ComplianceBadges } from '@/components/legal/ComplianceBadges'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizedHref } from '@/lib/i18n/routing'
import { getRequestLocale } from '@/lib/i18n/server'
import { getLegalLinks } from '@/lib/legal-config'
import { publicSocialLinks } from '@/lib/public-navigation'

export async function Footer() {
  const locale = await getRequestLocale()
  const dictionary = getDictionary(locale)
  const href = (path: string) => localizedHref(path, locale)
  const productLinks = [
    { name: dictionary.navigation.features, href: '/features' },
    { name: dictionary.footer.reservations, href: '/#reservations' },
    { name: dictionary.footer.whoItsFor, href: '/solutions' },
    { name: dictionary.navigation.pricing, href: '/pricing' },
    { name: dictionary.footer.downloadApps, href: '/download' },
  ] as const
  const companyLinks = [
    { name: dictionary.navigation.company, href: '/sobre-nosotros' },
    { name: dictionary.navigation.blog, href: '/blog' },
    { name: dictionary.navigation.news, href: '/news' },
    { name: dictionary.navigation.download, href: '/download' },
    { name: dictionary.navigation.contact, href: '/contacto' },
  ] as const

  return (
    <footer className="bg-[#050f24] text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Link href={href('/')} className="flex items-center gap-2.5">
              <Image src="/logos/akademate-icon-48.png" alt="" width={34} height={34} />
              <span className="text-sm font-extrabold tracking-[0.12em]">AKADEMATE</span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-7 text-blue-100/65">
              {dictionary.footer.description}
            </p>
            {publicSocialLinks.length > 0 ? (
              <div
                className="mt-6 flex items-center gap-2"
                aria-label={dictionary.footer.socialMedia}
              >
                {publicSocialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${link.name}: ${dictionary.footer.socialLabel}`}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[.06] text-blue-100/70 transition hover:border-blue-300/40 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                  >
                    {link.name === 'LinkedIn' ? (
                      <LinkedInMark />
                    ) : link.name === 'Instagram' ? (
                      <InstagramMark />
                    ) : link.name === 'Facebook' ? (
                      <FacebookMark />
                    ) : (
                      <XMark />
                    )}
                  </a>
                ))}
              </div>
            ) : null}
            <div className="mt-6">
              <ComplianceBadges />
            </div>
          </div>
          <FooterColumn title={dictionary.footer.product} links={productLinks} href={href} />
          <FooterColumn title={dictionary.footer.company} links={companyLinks} href={href} />
          <div>
            <FooterColumn
              title={dictionary.footer.legal}
              links={getLegalLinks(locale).map(({ title, href }) => ({ name: title, href }))}
              href={href}
            />
            <a
              className="mt-5 inline-block text-sm text-blue-200 hover:text-white"
              href="mailto:info@akademate.com"
            >
              info@akademate.com
            </a>
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-8">
          <p className="text-center text-xs leading-5 text-blue-100/45 sm:text-left">
            © {new Date().getFullYear()} Akademate. {dictionary.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
  href,
}: {
  title: string
  links: readonly { name: string; href: string }[]
  href: (path: string) => string
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={href(link.href)} className="text-sm text-blue-100/60 hover:text-white">
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function LinkedInMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.37V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.73V1.73C24 .77 23.21 0 22.23 0Z" />
    </svg>
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
