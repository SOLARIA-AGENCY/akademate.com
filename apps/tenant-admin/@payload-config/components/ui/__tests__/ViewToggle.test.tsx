import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ViewToggle } from '../ViewToggle'

const SOURCE = readFileSync(resolve(__dirname, '../ViewToggle.tsx'), 'utf8')

describe('ViewToggle', () => {
  it('wraps ToggleGroup instead of native buttons', () => {
    expect(SOURCE).toContain('ToggleGroup')
    expect(SOURCE).toContain('ToggleGroupItem')
    expect(SOURCE).not.toMatch(/<button/)
  })

  it('renders grid and list options', () => {
    render(<ViewToggle view="grid" onViewChange={vi.fn()} />)
    expect(screen.getByLabelText('Vista en cuadrícula')).toBeInTheDocument()
    expect(screen.getByLabelText('Vista en lista')).toBeInTheDocument()
  })
})
