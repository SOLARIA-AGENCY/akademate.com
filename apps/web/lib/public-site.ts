export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://akademate.com'

export const LEGAL_PLACEHOLDER = 'Pendiente de confirmación documental antes de publicación contractual'

type PublicLegalIdentity = {
  legalName: string
  registryCode: string
  taxId: string
  registeredAddress: string
  legalEmail: string
}

export function getPublicLegalIdentity(
  env: Record<string, string | undefined> = process.env
): PublicLegalIdentity {
  return {
    legalName: 'SOLARIA AGENCY OÜ',
    registryCode: env.NEXT_PUBLIC_LEGAL_REGISTRY_CODE?.trim() || LEGAL_PLACEHOLDER,
    taxId: env.NEXT_PUBLIC_LEGAL_TAX_ID?.trim() || LEGAL_PLACEHOLDER,
    registeredAddress: env.NEXT_PUBLIC_LEGAL_ADDRESS?.trim() || LEGAL_PLACEHOLDER,
    legalEmail: env.NEXT_PUBLIC_LEGAL_EMAIL?.trim() || LEGAL_PLACEHOLDER,
  }
}

export const publicNavigation = [
  { name: 'Inicio', href: '/' },
  { name: 'Capacidades', href: '/#capacidades' },
  { name: 'Cursos', href: '/cursos' },
  { name: 'Sobre Akademate', href: '/sobre-nosotros' },
  { name: 'Blog', href: '/blog' },
  { name: 'Contacto', href: '/contacto' },
] as const

export const publicLegalRoutes = [
  { name: 'Privacidad', href: '/legal/privacidad' },
  { name: 'Términos', href: '/legal/terminos' },
  { name: 'Cookies', href: '/legal/cookies' },
  { name: 'Subencargados', href: '/legal/subencargados' },
  { name: 'Transparencia IA', href: '/legal/transparencia-ia' },
] as const

export const indexableRoutes = [
  '/',
  '/cursos',
  '/sobre-nosotros',
  '/blog',
  '/contacto',
  ...publicLegalRoutes.map((route) => route.href),
] as const

export type TrackerCategory = 'analytics' | 'marketing'

export type TrackerConfiguration = {
  active: readonly TrackerCategory[]
  blocked: readonly string[]
  requiresConsent: boolean
}

/**
 * There are no optional tracker loaders in apps/web today. Environment values
 * cannot silently activate one: every requested provider remains blocked until
 * a reviewed loader and a granular consent contract are added together.
 */
export function resolveTrackerConfiguration(raw?: string): TrackerConfiguration {
  const requested = (raw ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)

  return {
    active: [],
    blocked: [...new Set(requested)],
    requiresConsent: false,
  }
}

export const trackerConfiguration = resolveTrackerConfiguration(
  process.env.NEXT_PUBLIC_TRACKERS
)
