import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PremiumDirectoryShell, ListingSearch } from '../PremiumDirectoryShell'

const SHELL_SOURCE = readFileSync(
  resolve(__dirname, '../PremiumDirectoryShell.tsx'),
  'utf8'
)

describe('PremiumDirectoryShell', () => {
  it('does not use native buttons for chrome controls', () => {
    expect(SHELL_SOURCE).not.toMatch(/<button/)
  })

  it('uses the official Kbd slug for the Cmd+K hint', () => {
    expect(SHELL_SOURCE).toContain("from '../ui/kbd'")
    expect(SHELL_SOURCE).toContain('<Kbd>')
    expect(SHELL_SOURCE).not.toMatch(/<kbd>/)
  })

  it('places search on the left and the control cluster on the right', () => {
    expect(SHELL_SOURCE).toContain('lg:ml-auto')
    expect(SHELL_SOURCE).toContain('lg:h-10')
  })

  it('renders search and view slots', () => {
    render(
      <PremiumDirectoryShell
        search={<ListingSearch value="" onChange={() => undefined} placeholder="Buscar sede..." />}
        view={<span>vista</span>}
      />
    )
    expect(screen.getByPlaceholderText('Buscar sede...')).toBeInTheDocument()
    expect(screen.getByText('vista')).toBeInTheDocument()
  })
})
