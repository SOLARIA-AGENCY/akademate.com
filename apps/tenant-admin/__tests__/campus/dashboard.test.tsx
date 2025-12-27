import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import CampusPage from '@/app/campus/page'

// Mock student data
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
    totalModules: 5,
    completedModules: 2,
    estimatedMinutesRemaining: 180,
  },
  {
    id: '2',
    courseTitle: 'JavaScript Avanzado',
    courseThumbnail: null,
    courseRunTitle: 'Edicion Febrero 2025',
    status: 'not_started',
    progressPercent: 0,
    totalModules: 8,
    completedModules: 0,
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

// Mock SessionProvider
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

// Mock router
vi.mock('next/navigation', async () => {
  return {
    useRouter: () => ({ push: vi.fn() }),
    useParams: () => ({}),
  }
})

describe('Campus Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem('campus_token', 'test-token')

    // Mock successful API response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        enrollments: mockEnrollments,
        stats: mockStats,
      }),
    })
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('renders welcome message with student name', async () => {
    render(<CampusPage />)

    await waitFor(() => {
      expect(screen.getByText(/hola, juan/i)).toBeInTheDocument()
    })
  })

  it('displays stats cards', async () => {
    render(<CampusPage />)

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument() // totalCourses
      expect(screen.getByText('5')).toBeInTheDocument() // currentStreak
      expect(screen.getByText('3')).toBeInTheDocument() // totalBadges
    })
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
      expect(screen.getByText(/en progreso/i)).toBeInTheDocument()
    })
  })

  it('links to course detail page', async () => {
    render(<CampusPage />)

    await waitFor(() => {
      const courseLinks = screen.getAllByRole('link')
      const courseLink = courseLinks.find(link =>
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
      }),
    })

    render(<CampusPage />)

    await waitFor(() => {
      expect(screen.getByText(/sin cursos activos/i)).toBeInTheDocument()
      expect(screen.getByText(/explorar cursos/i)).toBeInTheDocument()
    })
  })
})
