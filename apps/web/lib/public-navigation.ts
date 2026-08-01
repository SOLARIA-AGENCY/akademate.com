export const publicNavigation = [
  { name: 'Features', href: '/features' },
  { name: "Who it's for", href: '/solutions' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Blog', href: '/blog' },
  { name: 'News', href: '/news' },
  { name: 'Company', href: '/sobre-nosotros' },
] as const

export const publicCompanyLinks = [
  { name: 'Company', href: '/sobre-nosotros' },
  { name: 'Blog', href: '/blog' },
  { name: 'News', href: '/news' },
  { name: 'Contact', href: '/contacto' },
] as const

export const publicSocialLinks = [
  {
    name: 'Instagram',
    href:
      process.env.NEXT_PUBLIC_INSTAGRAM_URL ??
      'https://www.instagram.com/explore/search/keyword/?q=akademate',
  },
  {
    name: 'X',
    href:
      process.env.NEXT_PUBLIC_X_URL ?? 'https://x.com/search?q=%22akademate.com%22&src=typed_query',
  },
  {
    name: 'Facebook',
    href: process.env.NEXT_PUBLIC_FACEBOOK_URL ?? 'https://www.facebook.com/search/top?q=akademate',
  },
] as const
