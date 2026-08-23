import { legalCompany } from '@/lib/legal-config'
import { publicSocialLinks } from '@/lib/public-navigation'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://akademate.com'

export function getPublicJsonLd() {
  const sameAs = publicSocialLinks.map((link) => link.href)
  const organizationId = `${siteUrl}/#organization`

  const organization: Record<string, unknown> = {
    '@type': 'Organization',
    '@id': organizationId,
    name: 'Akademate',
    legalName: legalCompany.name,
    url: siteUrl,
    logo: `${siteUrl}/logos/akademate-logo-official.png`,
    email: 'info@akademate.com',
  }

  if (sameAs.length > 0) organization.sameAs = sameAs

  const software: Record<string, unknown> = {
    '@type': 'SoftwareApplication',
    name: 'Akademate',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: siteUrl,
    description:
      'Academy operating system for enrolment, teaching, payments and multi-site operations.',
    provider: { '@id': organizationId },
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [organization, software],
  }
}
