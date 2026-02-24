'use client'

import * as React from 'react'

type TenantTheme = {
  primary: string
  secondary: string
  accent: string
  success: string
  warning: string
  danger: string
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
  academyName: 'AKADEMATE',
  logos: {
    principal: '/logos/akademate-logo.svg',
    oscuro: '/logos/akademate-logo.svg',
    claro: '/logos/akademate-logo-alpha.svg',
    favicon: '/logos/akademate-favicon.svg',
  },
  // Default brand palette aligned to AKADEMATE public blue.
  theme: {
    primary: '#0066cc',
    secondary: '#64748b',
    accent: '#1d4ed8',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
  },
  tenantId: process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ?? '1',
}

const TenantBrandingContext = React.createContext<TenantBrandingContextValue | undefined>(undefined)

function hexToHSL(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '0 0% 50%'

  const r = parseInt(result[1] ?? '00', 16) / 255
  const g = parseInt(result[2] ?? '00', 16) / 255
  const b = parseInt(result[3] ?? '00', 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

function applyThemeVariables(theme: TenantTheme): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.style.setProperty('--primary', hexToHSL(theme.primary))
  root.style.setProperty('--secondary', hexToHSL(theme.secondary))
  root.style.setProperty('--accent', hexToHSL(theme.accent))
  root.style.setProperty('--success', hexToHSL(theme.success))
  root.style.setProperty('--warning', hexToHSL(theme.warning))
  root.style.setProperty('--destructive', hexToHSL(theme.danger))
}

export function TenantBrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = React.useState<TenantBranding>(DEFAULT_BRANDING)
  const [loading, setLoading] = React.useState(true)

  const refresh = React.useCallback(async () => {
    const tenantId = DEFAULT_BRANDING.tenantId
    setLoading(true)
    try {
      const [logosRes, academyRes, themeRes] = await Promise.all([
        fetch(`/api/config?section=logos&tenantId=${tenantId}`, { cache: 'no-store' }),
        fetch(`/api/config?section=academia&tenantId=${tenantId}`, { cache: 'no-store' }),
        fetch(`/api/config?section=personalizacion&tenantId=${tenantId}`, { cache: 'no-store' }),
      ])

      const nextBranding: TenantBranding = {
        ...DEFAULT_BRANDING,
        tenantId,
      }

      if (logosRes.ok) {
        const logosPayload = (await logosRes.json()) as { data?: Partial<TenantLogos> }
        nextBranding.logos = { ...DEFAULT_BRANDING.logos, ...logosPayload.data }
      }

      if (academyRes.ok) {
        const academyPayload = (await academyRes.json()) as { data?: { nombre?: string } }
        nextBranding.academyName = academyPayload.data?.nombre?.trim() || DEFAULT_BRANDING.academyName
      }

      if (themeRes.ok) {
        const themePayload = (await themeRes.json()) as { data?: Partial<TenantTheme> }
        nextBranding.theme = { ...DEFAULT_BRANDING.theme, ...themePayload.data }
      }

      setBranding(nextBranding)
      applyThemeVariables(nextBranding.theme)
    } catch {
      setBranding(DEFAULT_BRANDING)
      applyThemeVariables(DEFAULT_BRANDING.theme)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void refresh()
  }, [refresh])

  React.useEffect(() => {
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

  return <TenantBrandingContext.Provider value={value}>{children}</TenantBrandingContext.Provider>
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
