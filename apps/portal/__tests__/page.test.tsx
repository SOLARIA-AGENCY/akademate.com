import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PortalPage from '../app/page'

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      new Response(
        JSON.stringify({
          services: [
            { key: 'web', label: 'web', state: 'online', latencyMs: 120 },
            { key: 'ops', label: 'ops', state: 'online', latencyMs: 180 },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )
  )
})

describe('PortalPage launchpad', () => {
  it('renders launchpad heading and dev mode badge', () => {
    render(<PortalPage />)
    expect(screen.getByText('AKADEMATE')).toBeInTheDocument()
    expect(screen.getByText('Dev Launchpad')).toBeInTheDocument()
    expect(screen.getByText('DEV MODE')).toBeInTheDocument()
  })

  it('renders all main service cards', () => {
    render(<PortalPage />)
    expect(screen.getByText('Web')).toBeInTheDocument()
    expect(screen.getByText('Ops Admin')).toBeInTheDocument()
    expect(screen.getByText('Tenant Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Payload CMS')).toBeInTheDocument()
    expect(screen.getByText('Campus Virtual')).toBeInTheDocument()
  })

  it('renders auto-login badges for protected apps', () => {
    render(<PortalPage />)
    const badges = screen.getAllByText('AUTO-LOGIN DEV')
    expect(badges.length).toBeGreaterThanOrEqual(4)
  })

  it('renders service status bar section', () => {
    render(<PortalPage />)
    expect(screen.getByText('Estado de servicios')).toBeInTheDocument()
  })

  it('keeps logo test id', () => {
    render(<PortalPage />)
    expect(screen.getByTestId('logo')).toBeInTheDocument()
  })
})
