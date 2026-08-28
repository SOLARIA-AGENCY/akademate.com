import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, beforeEach } from 'vitest'
import { CookieBanner, CONSENT_KEY } from '@/app/(public)/_components/CookieBanner'

const sourcePath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../app/(public)/_components/CookieBanner.tsx',
)
const source = readFileSync(sourcePath, 'utf8')

describe('CookieBanner source contract', () => {
  it('uses the generic tenant consent key', () => {
    expect(CONSENT_KEY).toBe('akademate_cookie_consent_v1')
    expect(source).toContain("akademate_cookie_consent_v1")
    expect(source).not.toContain('cep_cookie_consent_v1')
  })

  it('fails if the banner stacks vertically', () => {
    expect(source).not.toMatch(/flex-col/)
    expect(source).toContain('flex-nowrap')
    expect(source).toContain('overflow-x-hidden')
    expect(source).toContain('py-2')
    expect(source).toContain('text-xs')
  })
})

describe('CookieBanner', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders one row with short copy and two actions', () => {
    render(<CookieBanner />)
    const banner = screen.getByTestId('cookie-banner')
    const row = banner.querySelector('div')
    expect(row?.className).toContain('flex-nowrap')
    expect(row?.className).toContain('items-center')
    expect(row?.className).not.toContain('flex-col')
    expect(screen.getByText(/Usamos cookies/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Política' })).toHaveAttribute('href', '/legal/cookies')
    expect(screen.getByRole('button', { name: 'Esenciales' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aceptar' })).toBeInTheDocument()
  })

  it('stores consent under akademate_cookie_consent_v1', () => {
    render(<CookieBanner />)
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }))
    expect(window.localStorage.getItem('akademate_cookie_consent_v1')).toBe('all')
    expect(window.localStorage.getItem('cep_cookie_consent_v1')).toBeNull()
    expect(screen.queryByTestId('cookie-banner')).not.toBeInTheDocument()
  })
})
