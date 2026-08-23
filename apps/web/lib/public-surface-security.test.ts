// @vitest-environment node

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const webRoot = new URL('../', import.meta.url)

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory())
      return entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'e2e'
        ? []
        : sourceFiles(path)
    return /\.(?:ts|tsx)$/.test(entry.name) && !entry.name.includes('.test.') ? [path] : []
  })
}

const source = sourceFiles(webRoot.pathname)
  .map((file) => readFileSync(file, 'utf8'))
  .join('\n')

describe('public access and claim surface', () => {
  it('does not ship the development credential gateway', () => {
    expect(existsSync(new URL('../app/login/LoginGateway.tsx', import.meta.url))).toBe(false)
    expect(source).not.toMatch(/admin\s*\/\s*1234/i)
    expect(source).not.toContain('/api/auth/dev-login')
    expect(existsSync(new URL('../app/api/auth/[...all]/route.ts', import.meta.url))).toBe(false)
    expect(existsSync(new URL('../lib/auth.ts', import.meta.url))).toBe(false)
  })

  it('does not publish previously fabricated identity or traction claims', () => {
    expect(source).not.toContain('+34 912345678')
    expect(source).not.toContain('Calle Principal 123')
    expect(source).not.toMatch(/50\+\s+academias/i)
    expect(source).not.toContain('Alicia Romero')
  })

  it('does not ship dead academy.akademate.com URLs or social search placeholders', () => {
    expect(source).not.toContain('academy.akademate.com')
    expect(source).not.toMatch(
      /instagram\.com\/explore\/search|facebook\.com\/search\/top|x\.com\/search\?q=/i
    )
  })

  it('does not execute known non-essential tracker signatures', () => {
    expect(source).not.toMatch(/gtag\s*\(/)
    expect(source).not.toMatch(/fbq\s*\(/)
    expect(source).not.toMatch(
      /googletagmanager\.com|google-analytics\.com|connect\.facebook\.net|static\.hotjar\.com/
    )
  })
})
