/**
 * Tests for TenantBrandingProvider.
 *
 * Critical regression coverage: verifies that applyThemeVariables does NOT
 * override the --secondary CSS custom property (a UI neutral token used by
 * badges, progress bars, buttons, etc.) with the tenant's brand secondary
 * color (which is a saturated/dark brand hue, not a neutral gray).
 *
 * Root cause that prompted these tests: setting --secondary: 240 28% 14%
 * (navy #1a1a2e) via inline style on <html> overrode the entire CSS cascade
 * including the .dark mode variables, making UI elements appear blue in dark
 * mode instead of neutral dark-gray.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { TenantBrandingProvider, useTenantBranding } from '../tenant-branding'

// Helper to read a CSS custom property from the root element
function getRootVar(name: string): string {
  return document.documentElement.style.getPropertyValue(name)
}

// Reset inline styles between tests to avoid cross-test pollution
beforeEach(() => {
  document.documentElement.style.cssText = ''
})

// ─── applyThemeVariables — what it MUST set ──────────────────────────────────

describe('TenantBrandingProvider - CSS variable injection', () => {
  it('sets --primary from the tenant brand color', async () => {
    render(
      <TenantBrandingProvider>
        <span>child</span>
      </TenantBrandingProvider>
    )
    await waitFor(() => {
      // CEP default primary: #F2014B → expect a non-empty HSL string
      expect(getRootVar('--primary')).not.toBe('')
    })
  })

  it('sets --brand-secondary (NOT --secondary) for the tenant brand secondary', async () => {
    render(
      <TenantBrandingProvider>
        <span>child</span>
      </TenantBrandingProvider>
    )
    await waitFor(() => {
      // The brand color must be stored in --brand-secondary
      const brandSecondary = getRootVar('--brand-secondary')
      expect(brandSecondary).not.toBe('')

      // CEP default secondary: #1a1a2e → HSL 240 28% 14%
      expect(brandSecondary).toBe('240 28% 14%')
    })
  })

  it('does NOT override --secondary with the tenant brand color', async () => {
    render(
      <TenantBrandingProvider>
        <span>child</span>
      </TenantBrandingProvider>
    )
    await waitFor(() => {
      // --secondary must remain empty (controlled by CSS cascade, not inline style)
      const secondary = getRootVar('--secondary')
      expect(secondary).toBe('')
    })
  })

  it('sets --accent from the tenant brand color', async () => {
    render(
      <TenantBrandingProvider>
        <span>child</span>
      </TenantBrandingProvider>
    )
    await waitFor(() => {
      expect(getRootVar('--accent')).not.toBe('')
    })
  })

  it('sets --success from the tenant brand color', async () => {
    render(
      <TenantBrandingProvider>
        <span>child</span>
      </TenantBrandingProvider>
    )
    await waitFor(() => {
      expect(getRootVar('--success')).not.toBe('')
    })
  })

  it('sets --warning from the tenant brand color', async () => {
    render(
      <TenantBrandingProvider>
        <span>child</span>
      </TenantBrandingProvider>
    )
    await waitFor(() => {
      expect(getRootVar('--warning')).not.toBe('')
    })
  })

  it('sets --destructive from the tenant brand danger color', async () => {
    render(
      <TenantBrandingProvider>
        <span>child</span>
      </TenantBrandingProvider>
    )
    await waitFor(() => {
      expect(getRootVar('--destructive')).not.toBe('')
    })
  })

  it('never sets --secondary-foreground as an inline style', async () => {
    render(
      <TenantBrandingProvider>
        <span>child</span>
      </TenantBrandingProvider>
    )
    await waitFor(() => {
      // --secondary-foreground is handled by CSS cascade only
      expect(getRootVar('--secondary-foreground')).toBe('')
    })
  })
})

// ─── hexToHSL conversion (tested indirectly via CSS variable values) ─────────

describe('TenantBrandingProvider - hexToHSL correctness', () => {
  it('converts CEP primary #F2014B to correct HSL', async () => {
    render(
      <TenantBrandingProvider>
        <span>child</span>
      </TenantBrandingProvider>
    )
    await waitFor(() => {
      // #F2014B → H≈342, S≈99%, L≈48%
      const primary = getRootVar('--primary')
      const [h, s, l] = primary.split(' ')
      expect(Number(h)).toBeGreaterThanOrEqual(340)
      expect(Number(h)).toBeLessThanOrEqual(345)
      expect(s).toMatch(/^9[0-9]%$/)
      expect(l).toMatch(/^4[0-9]%$/)
    })
  })

  it('converts CEP secondary #1a1a2e to 240 28% 14%', async () => {
    render(
      <TenantBrandingProvider>
        <span>child</span>
      </TenantBrandingProvider>
    )
    await waitFor(() => {
      expect(getRootVar('--brand-secondary')).toBe('240 28% 14%')
    })
  })

  it('converts CEP accent #ff6600 to correct orange HSL', async () => {
    render(
      <TenantBrandingProvider>
        <span>child</span>
      </TenantBrandingProvider>
    )
    await waitFor(() => {
      // #ff6600 → H=24, S=100%, L=50%
      const accent = getRootVar('--accent')
      const [h, s, l] = accent.split(' ')
      expect(Number(h)).toBeGreaterThanOrEqual(22)
      expect(Number(h)).toBeLessThanOrEqual(26)
      expect(s).toBe('100%')
      expect(l).toBe('50%')
    })
  })
})

// ─── Theme update from API fetch ──────────────────────────────────────────────

describe('TenantBrandingProvider - theme API update', () => {
  it('updates --brand-secondary when API returns a custom theme', async () => {
    // Override fetch to return a custom theme with a different secondary color
    vi.mocked(global.fetch).mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes('section=personalizacion')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: {
                primary: '#000000',
                secondary: '#ffffff',
                accent: '#ff0000',
                success: '#00ff00',
                warning: '#ffff00',
                danger: '#ff0000',
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        )
      }
      return Promise.resolve(
        new Response(JSON.stringify({ data: {} }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })

    render(
      <TenantBrandingProvider>
        <span>child</span>
      </TenantBrandingProvider>
    )

    await waitFor(() => {
      // #ffffff → 0 0% 100%
      const brandSecondary = getRootVar('--brand-secondary')
      expect(brandSecondary).toBe('0 0% 100%')
    })
  })

  it('does NOT set --secondary even when API returns a custom theme', async () => {
    vi.mocked(global.fetch).mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes('section=personalizacion')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: {
                primary: '#111111',
                secondary: '#222222',
                accent: '#333333',
                success: '#22c55e',
                warning: '#f59e0b',
                danger: '#ef4444',
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        )
      }
      return Promise.resolve(
        new Response(JSON.stringify({ data: {} }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })

    render(
      <TenantBrandingProvider>
        <span>child</span>
      </TenantBrandingProvider>
    )

    await waitFor(() => {
      // --brand-secondary should be set (with the custom color)
      expect(getRootVar('--brand-secondary')).not.toBe('')
      // --secondary must remain empty (never overridden)
      expect(getRootVar('--secondary')).toBe('')
    })
  })

  it('falls back to defaults when API call fails', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'))

    render(
      <TenantBrandingProvider>
        <span>child</span>
      </TenantBrandingProvider>
    )

    await waitFor(() => {
      // Fallback defaults are applied: CEP navy → 240 28% 14%
      expect(getRootVar('--brand-secondary')).toBe('240 28% 14%')
      expect(getRootVar('--secondary')).toBe('')
    })
  })
})

// ─── Provider renders children ────────────────────────────────────────────────

describe('TenantBrandingProvider - rendering', () => {
  it('renders children', async () => {
    render(
      <TenantBrandingProvider>
        <span data-testid="child">Content</span>
      </TenantBrandingProvider>
    )
    // waitFor ensures async state updates (from the initial refresh) settle
    await waitFor(() => {
      expect(screen.getByTestId('child')).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })
})

// ─── useTenantBranding hook — fallback ────────────────────────────────────────

describe('useTenantBranding hook', () => {
  it('returns default branding when used outside of provider', () => {
    function Consumer() {
      const { branding, loading } = useTenantBranding()
      return (
        <div>
          <span data-testid="name">{branding.academyName}</span>
          <span data-testid="loading">{loading ? 'loading' : 'idle'}</span>
        </div>
      )
    }

    render(<Consumer />)
    expect(screen.getByTestId('name')).toHaveTextContent('CEP Formación')
    expect(screen.getByTestId('loading')).toHaveTextContent('idle')
  })

  it('exposes tenantId from default branding', () => {
    function Consumer() {
      const { branding } = useTenantBranding()
      return <span data-testid="tid">{branding.tenantId}</span>
    }

    render(<Consumer />)
    // tenantId comes from env var or '1'
    expect(screen.getByTestId('tid')).toBeInTheDocument()
  })
})
