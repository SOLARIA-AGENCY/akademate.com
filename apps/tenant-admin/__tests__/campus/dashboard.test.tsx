import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import CampusPage from '@/app/campus/page'

const mockStudent = {
  id: '1',
  email: 'student@test.com',
  firstName: 'Juan',
  lastName: 'Garcia',
  fullName: 'Juan Garcia',
  tenantId: 1,
}

const mockEnrollments = [
  {
    id: '1',
    courseTitle: 'Curso de React',
    courseThumbnail: null,
    courseRunTitle: 'Edicion Enero 2025',
    status: 'in_progress',
    progressPercent: 45,
    estimatedMinutesRemaining: 180,
  },
  {
    id: '2',
    courseTitle: 'JavaScript Avanzado',
    courseThumbnail: null,
    courseRunTitle: 'Edicion Febrero 2025',
    status: 'not_started',
    progressPercent: 0,
    estimatedMinutesRemaining: 480,
  },
]

const mockStats = {
  totalCourses: 2,
  completedCourses: 0,
  currentStreak: 5,
  totalBadges: 3,
  totalPoints: 450,
}

vi.mock('@/app/campus/providers/SessionProvider', () => ({
  useSession: () => ({
    student: mockStudent,
    enrollments: [],
    isLoading: false,
    isAuthenticated: true,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    refreshSession: vi.fn(),
  }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  RequireAuth: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('recharts', () => ({
  RadialBarChart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  RadialBar: () => null,
  PolarGrid: () => null,
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('next/navigation', async () => {
  return {
    useRouter: () => ({ push: vi.fn() }),
    useParams: () => ({}),
    usePathname: () => '/campus',
  }
})

describe('Campus Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem('campus_token', 'test-token')

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        enrollments: mockEnrollments,
        stats: mockStats,
        liveClass: null,
        upcoming: [],
        attendanceRate: null,
        badges: [],
        weeklyActivity: [1, 1, 1, 1, 1, 0, 0],
      }),
    })
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('renders welcome message with student name', async () => {
    render(<CampusPage />)

    await waitFor(() => {
      expect(screen.getByText(/hola de nuevo, juan/i)).toBeInTheDocument()
    })
  })

  it('does not render lucide kpi tiles', async () => {
    render(<CampusPage />)

    await waitFor(() => {
      expect(screen.getByText(/hola de nuevo/i)).toBeInTheDocument()
    })
    expect(screen.queryByText('Cursos Activos')).not.toBeInTheDocument()
    expect(screen.queryByText('Insignias')).not.toBeInTheDocument()
  })

  it('renders enrollment cards', async () => {
    render(<CampusPage />)

    await waitFor(() => {
      expect(screen.getByText('Curso de React')).toBeInTheDocument()
      expect(screen.getByText('JavaScript Avanzado')).toBeInTheDocument()
    })
  })

  it('shows progress for in-progress courses', async () => {
    render(<CampusPage />)

    await waitFor(() => {
      expect(screen.getByText('45%')).toBeInTheDocument()
    })
  })

  it('links to course detail page', async () => {
    render(<CampusPage />)

    await waitFor(() => {
      const courseLinks = screen.getAllByRole('link')
      const courseLink = courseLinks.find((link) =>
        link.getAttribute('href')?.includes('/campus/cursos/')
      )
      expect(courseLink).toBeTruthy()
    })
  })

  it('displays empty state when no enrollments', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        enrollments: [],
        stats: { totalCourses: 0, completedCourses: 0, currentStreak: 0, totalBadges: 0 },
        liveClass: null,
        upcoming: [],
        attendanceRate: null,
        badges: [],
      }),
    })

    render(<CampusPage />)

    await waitFor(() => {
      expect(screen.getByText(/sin cursos activos/i)).toBeInTheDocument()
      expect(screen.getByText(/explorar cursos/i)).toBeInTheDocument()
    })
  })

  it('keeps live class empty when the api sends null', async () => {
    render(<CampusPage />)

    await waitFor(() => {
      expect(screen.getByText(/no hay clase en directo hoy/i)).toBeInTheDocument()
    })
  })
})
