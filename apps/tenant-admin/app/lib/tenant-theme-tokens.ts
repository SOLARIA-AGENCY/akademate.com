/** Shared hex to HSL for first paint and TenantBranding. No host-specific color. */

function parseHexChannel(value: string): number {
  return Number.parseInt(value, 16) / 255
}

export function hexToHsl(hex: string): string {
  const normalized = hex.replace('#', '')
  if (normalized.length !== 6) return '0 0% 50%'

  const r = parseHexChannel(normalized.slice(0, 2))
  const g = parseHexChannel(normalized.slice(2, 4))
  const b = parseHexChannel(normalized.slice(4, 6))
  if ([r, g, b].some((channel) => Number.isNaN(channel))) return '0 0% 50%'

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

/** Inline :root rules so the first paint uses the tenant primary, not SaaS CSS blue. */
export function tenantBrandFirstPaintCss(primaryHex: string): string {
  const hsl = hexToHsl(primaryHex)
  return `:root{--primary:${hsl};--ring:${hsl};--brand:${hsl};--sidebar-primary:${hsl};--sidebar-ring:${hsl}}`
}
