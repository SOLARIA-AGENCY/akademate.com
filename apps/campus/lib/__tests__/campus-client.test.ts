import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  CampusApiError,
  fetchCampusDashboard,
  fetchCampusSession,
  loginCampus,
  logoutCampus,
} from '../campus-client'

const fetchMock = vi.fn()
global.fetch = fetchMock

const student = { id: '9', email: 'student@example.com', firstName: 'Ana', lastName: 'Sol', tenantId: 7 }

describe('canonical campus client', () => {
  beforeEach(() => fetchMock.mockReset())

  it('uses only the canonical session endpoint and clears a 401', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 401 }))
    await expect(fetchCampusSession('https://api.example')).resolves.toBeNull()
    expect(fetchMock).toHaveBeenCalledWith('https://api.example/api/campus/auth/session', expect.any(Object))
  })

  it('normalizes a valid student and rejects an unsafe tenant identity', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ success: true, student }))
    await expect(fetchCampusSession('')).resolves.toMatchObject({ id: '9', tenantId: 7, roles: ['student'] })
    fetchMock.mockResolvedValueOnce(Response.json({ success: true, student: { ...student, tenantId: null } }))
    await expect(fetchCampusSession('')).rejects.toBeInstanceOf(CampusApiError)
  })

  it('sends credentials to canonical login and never to dev-login', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ success: true, student }))
    await loginCampus('', 'student@example.com', 'secret')
    expect(fetchMock).toHaveBeenCalledWith('/api/campus/auth/login', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email: 'student@example.com', password: 'secret' }),
    }))
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain('dev-login')
  })

  it('uses canonical logout and propagates remote failures', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ success: true }))
    await logoutCampus('')
    expect(fetchMock).toHaveBeenCalledWith('/api/campus/auth/logout', expect.objectContaining({ method: 'POST' }))
    fetchMock.mockResolvedValueOnce(Response.json({ error: 'blocked' }, { status: 503 }))
    await expect(logoutCampus('')).rejects.toMatchObject({ status: 503 })
  })

  it('loads dashboard data and rejects malformed or unauthorized responses', async () => {
    const dashboard = { success: true, enrollments: [], stats: { totalCourses: 0, completedCourses: 0, currentStreak: 0, totalBadges: 0, totalPoints: 0 } }
    fetchMock.mockResolvedValueOnce(Response.json(dashboard))
    await expect(fetchCampusDashboard('')).resolves.toEqual({ enrollments: [], stats: dashboard.stats })
    fetchMock.mockResolvedValueOnce(Response.json({ error: 'unauthorized' }, { status: 401 }))
    await expect(fetchCampusDashboard('')).rejects.toMatchObject({ status: 401 })
    fetchMock.mockResolvedValueOnce(Response.json({ success: true, enrollments: 'stale', stats: {} }))
    await expect(fetchCampusDashboard('')).rejects.toMatchObject({ status: 502 })
  })
})
