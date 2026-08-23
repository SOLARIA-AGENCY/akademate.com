export const publicNavigation = [
  { name: 'Features', href: '/features' },
  { name: "Who it's for", href: '/solutions' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Company', href: '/sobre-nosotros' },
] as const

export const publicCompanyLinks = [
  { name: 'Company', href: '/sobre-nosotros' },
  { name: 'Blog', href: '/blog' },
  { name: 'News', href: '/news' },
  { name: 'Download', href: '/download' },
  { name: 'Contact', href: '/contacto' },
] as const

export type PublicSocialNetwork = 'LinkedIn' | 'Instagram' | 'X' | 'Facebook'

export type PublicSocialLink = {
  name: PublicSocialNetwork
  href: string
}

const socialCandidates: ReadonlyArray<{ name: PublicSocialNetwork; href?: string }> = [
  { name: 'LinkedIn', href: process.env.NEXT_PUBLIC_LINKEDIN_URL },
  { name: 'Instagram', href: process.env.NEXT_PUBLIC_INSTAGRAM_URL },
  { name: 'X', href: process.env.NEXT_PUBLIC_X_URL },
  { name: 'Facebook', href: process.env.NEXT_PUBLIC_FACEBOOK_URL },
]

/**
 * Only publish a social icon when the URL is a real profile.
 * Search, explore-search and unconfigured values stay hidden.
 */
export function isPublishedSocialProfile(url: string | undefined | null): url is string {
  if (!url) return false

  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false

    const host = parsed.hostname.replace(/^www\./, '').toLowerCase()
    const path = parsed.pathname.toLowerCase()
    const search = parsed.search.toLowerCase()
    if (
      path.includes('/search') ||
      path.includes('/explore/search') ||
      search.includes('src=typed_query')
    )
      return false

    if (host.endsWith('linkedin.com')) return path.includes('/company/') || path.includes('/in/')
    if (host.endsWith('instagram.com')) return path.split('/').filter(Boolean).length >= 1
    if (host === 'x.com' || host === 'twitter.com')
      return path.split('/').filter(Boolean).length >= 1
    if (host.endsWith('facebook.com')) return path.split('/').filter(Boolean).length >= 1

    return false
  } catch {
    return false
  }
}

export const publicSocialLinks: readonly PublicSocialLink[] = socialCandidates.flatMap(
  (candidate) =>
    isPublishedSocialProfile(candidate.href) ? [{ name: candidate.name, href: candidate.href }] : []
)
