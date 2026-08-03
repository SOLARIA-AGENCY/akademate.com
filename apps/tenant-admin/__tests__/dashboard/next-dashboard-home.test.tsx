import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import DashboardHome from '@/app/(app)/(dashboard)/_components/DashboardHome'

const dashboard = {
  generatedAt: '2026-08-03T16:00:00.000Z',
  metrics: {
    courses: 4,
    activeStudents: 28,
    activeTeachers: 6,
    campuses: 2,
    activeCourseRuns: 3,
    confirmedEnrollments: 24,
    pendingRequests: 5,
  },
  attention: { pendingReview: 2, waitlisted: 1, paymentReview: 0 },
  upcomingRuns: [
    {
      id: 91,
      courseName: 'Creative Leadership',
      code: 'CL-SEP',
      status: 'enrollment_open',
      startsAt: '2026-09-12T09:00:00.000Z',
      availablePlaces: 8,
    },
  ],
  recentActivity: [
    {
      id: 'submission-72',
      kind: 'application',
      title: 'Nueva solicitud recibida',
      detail: 'Creative Leadership',
      occurredAt: '2026-08-03T15:30:00.000Z',
      href: '/dashboard/cursos/solicitudes',
    },
  ],
}

afterEach(() => vi.restoreAllMocks())

describe('Next dashboard home', () => {
  it('loads one canonical Next projection and renders operational priorities', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(dashboard), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    )

    render(<DashboardHome />)

    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
    await screen.findByText('Solicitudes pendientes')
    expect(screen.getByText('28')).toBeInTheDocument()
    expect(screen.getByText('Creative Leadership')).toBeInTheDocument()
    expect(screen.getByText('Solicitudes por revisar')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('/api/next/dashboard', {
      credentials: 'include',
      cache: 'no-store',
      signal: expect.any(AbortSignal),
    })
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/api/cycles'))).toBe(
      false
    )
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/api/lms'))).toBe(false)
  })

  it('shows a bounded retry state instead of rendering zeros after an HTTP failure', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'dashboard_service_unavailable' }), { status: 503 })
      )
      .mockResolvedValueOnce(new Response(JSON.stringify(dashboard), { status: 200 }))

    render(<DashboardHome />)

    await screen.findByText('No pudimos cargar la operativa')
    expect(screen.queryByText('Solicitudes pendientes')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    await screen.findByText('Solicitudes pendientes')
  })

  it('uses explicit empty states for upcoming runs and activity', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          ...dashboard,
          upcomingRuns: [],
          recentActivity: [],
        }),
        { status: 200 }
      )
    )

    render(<DashboardHome />)

    expect(await screen.findByText('No hay próximas convocatorias')).toBeInTheDocument()
    expect(screen.getByText('La actividad aparecerá aquí')).toBeInTheDocument()
  })
})
