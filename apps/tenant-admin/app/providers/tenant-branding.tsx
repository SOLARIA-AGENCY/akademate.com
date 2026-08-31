'use client'

import * as React from 'react'
import { hexToHsl } from '@/app/lib/tenant-theme-tokens'

/** Platform defaults. Dashboard chrome reads these tokens, never a host hex. */
export const AKADEMATE_PRIMARY = '#0066CC'
export const AKADEMATE_SIDEBAR = '#0F2440'
export const AKADEMATE_ACCENT = '#0088FF'

type TenantTheme = {
  primary: string
  secondary: string
  accent: string
  success: string
  warning: string
  danger: string
  sidebar: string
}

type TenantLogos = {
  principal: string
  oscuro: string
  claro: string
  favicon: string
}

export type TenantBranding = {
  academyName: string
  logos: TenantLogos
  theme: TenantTheme
  tenantId: string
}

type TenantBrandingContextValue = {
  branding: TenantBranding
  loading: boolean
  refresh: () => Promise<void>
}

const DEFAULT_BRANDING: TenantBranding = {
  academyName: 'Akademate',
  logos: {
    principal: '/logos/akademate-logo-official.png',
    oscuro: '/logos/akademate-logo-official.png',
    claro: '/logos/akademate-logo-official.png',
    favicon: '/logos/akademate-favicon.svg',
  },
  theme: {
    primary: AKADEMATE_PRIMARY,
    secondary: '#1a1a2e',
    accent: AKADEMATE_ACCENT,
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    sidebar: AKADEMATE_SIDEBAR,
  },
  tenantId: process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ?? 'default',
}

const TenantBrandingContext = React.createContext<TenantBrandingContextValue | undefined>(undefined)

function channelLightness(hex: string): number {
  const normalized = hex.replace('#', '')
  if (normalized.length !== 6) return 50
  const r = Number.parseInt(normalized.slice(0, 2), 16) / 255
  const g = Number.parseInt(normalized.slice(2, 4), 16) / 255
  const b = Number.parseInt(normalized.slice(4, 6), 16) / 255
  if ([r, g, b].some((channel) => Number.isNaN(channel))) return 50
  return ((Math.max(r, g, b) + Math.min(r, g, b)) / 2) * 100
}

function applyThemeVariables(theme: TenantTheme): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const primaryHsl = hexToHsl(theme.primary)
  const sidebarHsl = hexToHsl(theme.sidebar)
  const sidebarIsDark = channelLightness(theme.sidebar) < 45

  root.style.setProperty('--primary', primaryHsl)
  root.style.setProperty('--ring', primaryHsl)
  root.style.setProperty('--brand', primaryHsl)
  // NOTE: --secondary is intentionally NOT overridden here.
  // shadcn/ui uses --secondary as a neutral surface color (light gray / dark gray).
  // The tenant brand secondary (#1a1a2e navy) is stored in --brand-secondary for
  // brand-specific elements only. Overriding --secondary breaks badges, bars, and
  // any neutral UI element that relies on the light/dark mode cascade.
  root.style.setProperty('--brand-secondary', hexToHsl(theme.secondary))
  root.style.setProperty('--accent', hexToHsl(theme.accent))
  root.style.setProperty('--success', hexToHsl(theme.success))
  root.style.setProperty('--warning', hexToHsl(theme.warning))
  root.style.setProperty('--destructive', hexToHsl(theme.danger))
  root.style.setProperty('--sidebar', sidebarHsl)
  root.style.setProperty('--sidebar-foreground', sidebarIsDark ? '210 40% 98%' : '222 47% 15%')
  root.style.setProperty('--sidebar-accent', sidebarIsDark ? '214 45% 22%' : '220 14% 93%')
  root.style.setProperty('--sidebar-accent-foreground', sidebarIsDark ? '210 40% 98%' : '222 47% 15%')
  root.style.setProperty('--sidebar-border', sidebarIsDark ? '214 32% 24%' : '220 13% 91%')
  root.style.setProperty('--sidebar-primary', primaryHsl)
  root.style.setProperty('--sidebar-ring', primaryHsl)
}

function mergeTheme(base: TenantTheme, patch?: Partial<TenantTheme> | null): TenantTheme {
  return {
    ...base,
    ...patch,
    primary: patch?.primary?.trim() || base.primary,
    secondary: patch?.secondary?.trim() || base.secondary,
    accent: patch?.accent?.trim() || base.accent,
    success: patch?.success?.trim() || base.success,
    warning: patch?.warning?.trim() || base.warning,
    danger: patch?.danger?.trim() || base.danger,
    sidebar: patch?.sidebar?.trim() || base.sidebar,
  }
}

export function TenantBrandingProvider({
  children,
  initialBranding,
}: {
  children: React.ReactNode
  initialBranding?: TenantBranding
}) {
  const [branding, setBranding] = React.useState<TenantBranding>(
    () => initialBranding ?? DEFAULT_BRANDING
  )
  const [loading, setLoading] = React.useState(true)

  const refresh = React.useCallback(async () => {
    const fallbackBranding = initialBranding ?? DEFAULT_BRANDING
    setLoading(true)
    try {
      const [logosRes, academyRes, themeRes] = await Promise.all([
        fetch('/api/config?section=logos', { cache: 'no-store' }),
        fetch('/api/config?section=academia', { cache: 'no-store' }),
        fetch('/api/config?section=personalizacion', { cache: 'no-store' }),
      ])

      const nextBranding: TenantBranding = {
        ...fallbackBranding,
        tenantId: fallbackBranding.tenantId,
      }

      if (logosRes.ok) {
        const logosPayload = (await logosRes.json()) as { data?: Partial<TenantLogos> }
        nextBranding.logos = { ...fallbackBranding.logos, ...logosPayload.data }
      }

      if (academyRes.ok) {
        const academyPayload = (await academyRes.json()) as { data?: { nombre?: string } }
        nextBranding.academyName =
          academyPayload.data?.nombre?.trim() || fallbackBranding.academyName
      }

      if (themeRes.ok) {
        const themePayload = (await themeRes.json()) as { data?: Partial<TenantTheme> }
        nextBranding.theme = mergeTheme(fallbackBranding.theme, themePayload.data)
      }

      setBranding(nextBranding)
      applyThemeVariables(nextBranding.theme)
    } catch {
      setBranding(fallbackBranding)
      applyThemeVariables(fallbackBranding.theme)
    } finally {
      setLoading(false)
    }
  }, [initialBranding])

  React.useEffect(() => {
    void refresh()
  }, [refresh])

  // Listen for config-updated events from the Configuracion page
  React.useEffect(() => {
    const handler = () => void refresh()
    window.addEventListener('config-updated', handler)
    return () => window.removeEventListener('config-updated', handler)
  }, [refresh])

  React.useLayoutEffect(() => {
    applyThemeVariables(branding.theme)
  }, [branding.theme])

  const value = React.useMemo<TenantBrandingContextValue>(
    () => ({
      branding,
      loading,
      refresh,
    }),
    [branding, loading, refresh]
  )

  return (
    <TenantBrandingContext.Provider value={value} data-oid="31m9n_n">
      {children}
    </TenantBrandingContext.Provider>
  )
}

export function useTenantBranding(): TenantBrandingContextValue {
  const context = React.useContext(TenantBrandingContext)
  if (!context) {
    return {
      branding: DEFAULT_BRANDING,
      loading: false,
      refresh: async () => undefined,
    }
  }
  return context
}
