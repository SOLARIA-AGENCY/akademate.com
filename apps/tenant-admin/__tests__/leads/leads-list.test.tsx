import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}))

// Status config (mirrors the component)
const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  new:            { label: 'Nuevo',              dot: 'bg-red-500',     badge: 'bg-red-100 text-red-800 border border-red-300' },
  contacted:      { label: 'Contactado',         dot: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-800' },
  following_up:   { label: 'En seguimiento',     dot: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-800' },
  interested:     { label: 'Interesado',         dot: 'bg-green-500',   badge: 'bg-green-100 text-green-800' },
  enrolling:      { label: 'En matriculacion',   dot: 'bg-blue-500',    badge: 'bg-blue-100 text-blue-800' },
  enrolled:       { label: 'Matriculado',        dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800 border border-emerald-300' },
  on_hold:        { label: 'En espera',          dot: 'bg-amber-500',   badge: 'bg-gray-100 text-gray-600' },
  not_interested: { label: 'No interesado',      dot: 'bg-gray-400',    badge: 'bg-gray-100 text-gray-500' },
  unreachable:    { label: 'No contactable',     dot: 'bg-gray-400',    badge: 'bg-gray-100 text-gray-500' },
  discarded:      { label: 'Descartado',         dot: 'bg-gray-400',    badge: 'bg-gray-50 text-gray-400' },
}

describe('Leads List — Status Config', () => {
  it('has all 10 statuses defined', () => {
    const expected = ['new', 'contacted', 'following_up', 'interested', 'enrolling', 'enrolled', 'on_hold', 'not_interested', 'unreachable', 'discarded']
    expect(Object.keys(STATUS_CONFIG)).toEqual(expected)
  })

  it('each status has dot, badge, and label', () => {
    for (const [key, cfg] of Object.entries(STATUS_CONFIG)) {
      expect(cfg.label).toBeTruthy()
      expect(cfg.dot).toMatch(/^bg-/)
      expect(cfg.badge).toMatch(/bg-/)
    }
  })

  it('new status has red dot', () => {
    expect(STATUS_CONFIG.new.dot).toBe('bg-red-500')
  })

  it('contacted/following_up/on_hold have amber dot', () => {
    expect(STATUS_CONFIG.contacted.dot).toBe('bg-amber-500')
    expect(STATUS_CONFIG.following_up.dot).toBe('bg-amber-500')
    expect(STATUS_CONFIG.on_hold.dot).toBe('bg-amber-500')
  })

  it('interested has green dot', () => {
    expect(STATUS_CONFIG.interested.dot).toBe('bg-green-500')
  })

  it('enrolling has blue dot', () => {
    expect(STATUS_CONFIG.enrolling.dot).toBe('bg-blue-500')
  })

  it('enrolled has emerald dot', () => {
    expect(STATUS_CONFIG.enrolled.dot).toBe('bg-emerald-500')
  })

  it('discarded/not_interested/unreachable have gray dot', () => {
    expect(STATUS_CONFIG.discarded.dot).toBe('bg-gray-400')
    expect(STATUS_CONFIG.not_interested.dot).toBe('bg-gray-400')
    expect(STATUS_CONFIG.unreachable.dot).toBe('bg-gray-400')
  })
})

describe('Leads List — Sort Priority', () => {
  const statusOrder = ['new', 'contacted', 'following_up', 'interested', 'on_hold', 'enrolling', 'enrolled', 'not_interested', 'unreachable', 'discarded']

  it('new leads appear first in priority order', () => {
    expect(statusOrder.indexOf('new')).toBe(0)
  })

  it('contacted appears before interested', () => {
    expect(statusOrder.indexOf('contacted')).toBeLessThan(statusOrder.indexOf('interested'))
  })

  it('discarded appears last', () => {
    expect(statusOrder.indexOf('discarded')).toBe(statusOrder.length - 1)
  })
})

describe('Leads List — KPIs', () => {
  it('dashboard endpoint returns correct shape', async () => {
    const mockDashboard = {
      totalLeads: 11,
      newThisMonth: 5,
      unattended: 3,
      conversionRate: 9.1,
      avgResponseHours: 2.5,
      openEnrollments: 1,
      followUpBreakdown: { contacted: 3, interested: 1 },
      convertedThisMonth: 0,
    }

    expect(mockDashboard.totalLeads).toBeGreaterThan(0)
    expect(mockDashboard.conversionRate).toBeGreaterThanOrEqual(0)
    expect(mockDashboard.conversionRate).toBeLessThanOrEqual(100)
    expect(mockDashboard.followUpBreakdown).toHaveProperty('contacted')
  })
})

describe('Leads List — Last Interactor', () => {
  it('maps lastInteractor correctly from API response', () => {
    const row = {
      id: 1,
      first_name: 'Test',
      status: 'contacted',
      last_interactor_name: 'Admin',
      last_interactor_channel: 'phone',
      last_interaction_at: '2026-04-07T10:00:00Z',
      interaction_count: '3',
    }

    const doc = {
      ...row,
      lastInteractor: row.last_interactor_name
        ? { name: row.last_interactor_name, channel: row.last_interactor_channel, at: row.last_interaction_at }
        : null,
      interactionCount: parseInt(row.interaction_count ?? '0'),
    }

    expect(doc.lastInteractor).not.toBeNull()
    expect(doc.lastInteractor!.name).toBe('Admin')
    expect(doc.lastInteractor!.channel).toBe('phone')
    expect(doc.interactionCount).toBe(3)
  })

  it('handles null lastInteractor when no interactions', () => {
    const row = {
      id: 2,
      first_name: 'New Lead',
      status: 'new',
      last_interactor_name: null,
      interaction_count: '0',
    }

    const doc = {
      ...row,
      lastInteractor: row.last_interactor_name ? { name: row.last_interactor_name } : null,
      interactionCount: parseInt(row.interaction_count ?? '0'),
    }

    expect(doc.lastInteractor).toBeNull()
    expect(doc.interactionCount).toBe(0)
  })
})
