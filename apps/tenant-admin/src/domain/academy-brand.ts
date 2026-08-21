export const AKADEMATE_PRIMARY = '#0066CC'
export const AKADEMATE_ACCENT = '#0088FF'
export const AKADEMATE_SIDEBAR = '#0F2440'
export const AKADEMATE_SECONDARY = '#1a1a2e'
/**
 * Colour that an old database schema wrote into every tenant as its column
 * default. It was never an intentional brand choice, so it must not be treated
 * as one. This set exists only to survive that migration artifact and should be
 * emptied once every tenant has saved its branding from the settings screen.
 */
const LEGACY_SCHEMA_DEFAULT_COLORS = new Set(['#f2014b', '#F2014B'])

export function normalizeHexColor(value: string | null | undefined): string {
  return (value ?? '').trim()
}

export function isLegacySchemaDefaultColor(value: string | null | undefined): boolean {
  return LEGACY_SCHEMA_DEFAULT_COLORS.has(normalizeHexColor(value))
}

export function hasCustomAcademyLogo(logoUrl: string | null | undefined): boolean {
  const logo = normalizeHexColor(logoUrl).toLowerCase()
  if (!logo) return false
  return !logo.includes('akademate-logo') && !logo.includes('akademate-favicon')
}

/**
 * Chrome starts as Akademate blue. An academy colour applies only when the
 * tenant actually saved branding — a custom logo or a colour that is not a
 * legacy schema default. Inheriting the old column default would paint one
 * academy's brand onto tenants that never chose it.
 */
export function resolveAcademyPrimary(input: {
  storedPrimary?: string | null
  storedSecondary?: string | null
  themePrimary?: string | null
  logoUrl?: string | null
}): string {
  const themePrimary = normalizeHexColor(input.themePrimary)
  if (themePrimary) return themePrimary

  const stored = normalizeHexColor(input.storedPrimary)
  if (!stored) return AKADEMATE_PRIMARY

  const secondary = normalizeHexColor(input.storedSecondary)
  const explicitSave =
    hasCustomAcademyLogo(input.logoUrl) ||
    Boolean(secondary && secondary.toLowerCase() !== AKADEMATE_SECONDARY.toLowerCase())

  if (isLegacySchemaDefaultColor(stored) && !explicitSave) {
    return AKADEMATE_PRIMARY
  }
  return stored
}

export function resolveAcademySidebar(input: {
  storedSidebar?: string | null
  themeSidebar?: string | null
}): string {
  return normalizeHexColor(input.themeSidebar) || normalizeHexColor(input.storedSidebar) || AKADEMATE_SIDEBAR
}
