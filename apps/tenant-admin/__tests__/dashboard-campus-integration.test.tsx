import { render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@payload-config/hooks', () => ({
  useDashboardMetrics: () => ({
    data: {
      metrics: {
        total_courses: 3,
        active_students: 3,
        leads_this_month: 4,
        total_teachers: 2,
        total_campuses: 2,
        active_convocations: 3,
      },
      convocations: [],
      campaigns: [],
      recentActivities: [],
      weeklyMetrics: {
        leads: [1, 2, 3, 4],
        enrollments: [1, 1, 2, 3],
        courses_added: [0, 1, 0, 1],
      },
      alerts: [],
      campusDistribution: [],
    },
    loading: false,
    error: null,
    isConnected: true,
    lastUpdate: new Date(),
    refresh: vi.fn(async () => undefined),
  }),
}));

import DashboardPage from '@/app/(dashboard)/page';

describe('Dashboard campus integration', () => {
  beforeEach(() => {
    vi.mocked(global.fetch).mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.includes('/api/lms/enrollments')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: [
                { id: '1', status: 'active', progress: { percent: 50 } },
                { id: '2', status: 'completed', progress: { percent: 100 } },
                { id: '3', status: 'completed', progress: { percent: 100 } },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        );
      }

      return Promise.resolve(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
  });

  it('renders campus integration card and quick access links', async () => {
    render(<DashboardPage />);

    const campusHeading = screen.getByText('Campus Virtual Integrado');
    expect(campusHeading).toBeInTheDocument();
    const campusCard = campusHeading.closest('[data-testid=\"card\"]');
    expect(campusCard).toBeTruthy();
    const scoped = within(campusCard as HTMLElement);

    expect(scoped.getByText('Inscripciones LMS')).toBeInTheDocument();
    expect(scoped.getByText('Finalización')).toBeInTheDocument();

    await waitFor(() => {
      expect(scoped.getByText('67%')).toBeInTheDocument();
      expect(scoped.getByText('3')).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: /Abrir módulo Campus/i })).toHaveAttribute(
      'href',
      '/campus-virtual'
    );
    expect(screen.getByRole('link', { name: /Ir al Campus alumno/i })).toHaveAttribute(
      'href',
      '/campus/login'
    );
  });
});
