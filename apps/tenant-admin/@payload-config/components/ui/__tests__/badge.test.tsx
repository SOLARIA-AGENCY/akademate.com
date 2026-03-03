/**
 * Tests for Badge component.
 *
 * Critical regression coverage: ensures the secondary variant uses CSS variable
 * tokens (bg-secondary / text-secondary-foreground) so that light/dark mode is
 * handled entirely by the CSS cascade — NOT by hardcoded Tailwind dark: media-
 * query classes, which only fire when the OS is in dark mode (not when the app's
 * .dark class is toggled manually via next-themes).
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge, badgeVariants } from '../badge'

// ─── badgeVariants class output ─────────────────────────────────────────────

describe('badgeVariants', () => {
  it('secondary variant uses CSS variable tokens, not hardcoded colors', () => {
    const classes = badgeVariants({ variant: 'secondary' })
    expect(classes).toContain('bg-secondary')
    expect(classes).toContain('text-secondary-foreground')
  })

  it('secondary variant does NOT have hardcoded dark:bg-slate- overrides', () => {
    // These classes only respond to OS-level dark mode (media query) not to the
    // manual .dark class toggle — they were incorrectly added and later removed.
    const classes = badgeVariants({ variant: 'secondary' })
    expect(classes).not.toContain('dark:bg-slate-')
    expect(classes).not.toContain('dark:text-slate-')
    expect(classes).not.toContain('dark:hover:bg-slate-')
  })

  it('secondary variant includes hover state', () => {
    const classes = badgeVariants({ variant: 'secondary' })
    expect(classes).toContain('hover:bg-secondary/80')
  })

  it('secondary variant includes border-transparent', () => {
    const classes = badgeVariants({ variant: 'secondary' })
    expect(classes).toContain('border-transparent')
  })

  it('default variant uses primary token', () => {
    const classes = badgeVariants({ variant: 'default' })
    expect(classes).toContain('bg-primary')
    expect(classes).toContain('text-primary-foreground')
  })

  it('destructive variant uses destructive token', () => {
    const classes = badgeVariants({ variant: 'destructive' })
    expect(classes).toContain('bg-destructive')
    expect(classes).toContain('text-destructive-foreground')
  })

  it('success variant uses semantic green', () => {
    const classes = badgeVariants({ variant: 'success' })
    expect(classes).toContain('bg-green-100')
    expect(classes).toContain('text-green-800')
    // Dark mode uses CSS class toggle — these need dark: variants
    expect(classes).toContain('dark:bg-green-900')
    expect(classes).toContain('dark:text-green-200')
  })

  it('warning variant uses semantic orange', () => {
    const classes = badgeVariants({ variant: 'warning' })
    expect(classes).toContain('bg-orange-100')
    expect(classes).toContain('text-orange-800')
    expect(classes).toContain('dark:bg-orange-900')
    expect(classes).toContain('dark:text-orange-200')
  })

  it('info variant uses semantic blue', () => {
    const classes = badgeVariants({ variant: 'info' })
    expect(classes).toContain('bg-blue-100')
    expect(classes).toContain('text-blue-800')
    expect(classes).toContain('dark:bg-blue-900')
    expect(classes).toContain('dark:text-blue-200')
  })

  it('neutral variant uses semantic gray', () => {
    const classes = badgeVariants({ variant: 'neutral' })
    expect(classes).toContain('bg-gray-100')
    expect(classes).toContain('text-gray-700')
    expect(classes).toContain('dark:bg-gray-800')
    expect(classes).toContain('dark:text-gray-300')
  })

  it('outline variant uses foreground text', () => {
    const classes = badgeVariants({ variant: 'outline' })
    expect(classes).toContain('text-foreground')
  })

  it('defaults to "default" variant when no variant specified', () => {
    const withDefault = badgeVariants({})
    const withExplicit = badgeVariants({ variant: 'default' })
    expect(withDefault).toBe(withExplicit)
  })
})

// ─── Badge component rendering ───────────────────────────────────────────────

describe('Badge component', () => {
  it('renders children', () => {
    render(<Badge>Admin</Badge>)
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('renders as a div element', () => {
    const { container } = render(<Badge>Test</Badge>)
    expect(container.firstChild?.nodeName).toBe('DIV')
  })

  it('applies secondary variant classes to the element', () => {
    const { container } = render(<Badge variant="secondary">Admin</Badge>)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('bg-secondary')
    expect(el.className).toContain('text-secondary-foreground')
  })

  it('secondary badge does not have hardcoded dark slate classes on the element', () => {
    const { container } = render(<Badge variant="secondary">Admin</Badge>)
    const el = container.firstChild as HTMLElement
    expect(el.className).not.toMatch(/dark:bg-slate-\d+/)
    expect(el.className).not.toMatch(/dark:text-slate-\d+/)
  })

  it('merges custom className with variant classes', () => {
    const { container } = render(
      <Badge variant="secondary" className="my-custom-class">
        Test
      </Badge>
    )
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('my-custom-class')
    expect(el.className).toContain('bg-secondary')
  })

  it('renders success variant with green classes', () => {
    const { container } = render(<Badge variant="success">Activo</Badge>)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('bg-green-100')
    expect(el.className).toContain('text-green-800')
  })

  it('renders warning variant with orange classes', () => {
    const { container } = render(<Badge variant="warning">Pendiente</Badge>)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('bg-orange-100')
    expect(el.className).toContain('text-orange-800')
  })

  it('renders info variant with blue classes', () => {
    const { container } = render(<Badge variant="info">Online</Badge>)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('bg-blue-100')
    expect(el.className).toContain('text-blue-800')
  })

  it('spreads additional HTML attributes', () => {
    render(<Badge data-testid="my-badge" aria-label="role badge">Admin</Badge>)
    const el = screen.getByTestId('my-badge')
    expect(el).toBeInTheDocument()
    expect(el).toHaveAttribute('aria-label', 'role badge')
  })
})
