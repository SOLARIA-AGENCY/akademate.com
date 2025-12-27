import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import CoursePage from '@/app/campus/cursos/[enrollmentId]/page'

// Mock course data
const mockCourseData = {
  enrollment: {
    id: 'enr-1',
    status: 'in_progress',
    enrolledAt: '2025-01-01T00:00:00Z',
    startedAt: '2025-01-02T00:00:00Z',
  },
  course: {
    id: 'course-1',
    title: 'Curso de React Avanzado',
    slug: 'react-avanzado',
    description: 'Aprende React hooks, context y patrones avanzados',
    thumbnail: null,
  },
  courseRun: {
    id: 'run-1',
    title: 'Edicion Enero 2025',
    startDate: '2025-01-01',
    status: 'active',
  },
  modules: [
    {
      id: 'mod-1',
      title: 'Introduccion a React',
      description: 'Fundamentos de React',
      order: 1,
      estimatedMinutes: 60,
      lessonsCount: 3,
      lessons: [
        {
          id: 'lesson-1',
          title: 'Que es React',
          order: 1,
          estimatedMinutes: 15,
          isMandatory: true,
          progress: { status: 'completed', progressPercent: 100 },
        },
        {
          id: 'lesson-2',
          title: 'JSX Basico',
          order: 2,
          estimatedMinutes: 20,
          isMandatory: true,
          progress: { status: 'in_progress', progressPercent: 50 },
        },
        {
          id: 'lesson-3',
          title: 'Componentes',
          order: 3,
          estimatedMinutes: 25,
          isMandatory: false,
          progress: { status: 'not_started', progressPercent: 0 },
        },
      ],
    },
    {
      id: 'mod-2',
      title: 'React Hooks',
      description: 'useState, useEffect y mas',
      order: 2,
      estimatedMinutes: 90,
      lessonsCount: 4,
      lessons: [
        {
          id: 'lesson-4',
          title: 'useState',
          order: 1,
          estimatedMinutes: 20,
          isMandatory: true,
          progress: { status: 'not_started', progressPercent: 0 },
        },
      ],
    },
  ],
  progress: {
    totalModules: 2,
    totalLessons: 7,
    completedLessons: 1,
    progressPercent: 14,
    status: 'in_progress',
  },
}

// Mock SessionProvider
vi.mock('@/app/campus/providers/SessionProvider', () => ({
  useSession: () => ({
    student: { id: '1', firstName: 'Juan' },
    isAuthenticated: true,
    isLoading: false,
  }),
  RequireAuth: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock router
vi.mock('next/navigation', async () => {
  return {
    useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
    useParams: () => ({ enrollmentId: 'enr-1' }),
  }
})

describe('Campus Course Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem('campus_token', 'test-token')

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockCourseData,
      }),
    })
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('renders course title and description', async () => {
    render(<CoursePage />)

    await waitFor(() => {
      expect(screen.getByText('Curso de React Avanzado')).toBeInTheDocument()
      expect(screen.getByText('Edicion Enero 2025')).toBeInTheDocument()
    })
  })

  it('displays overall progress', async () => {
    render(<CoursePage />)

    await waitFor(() => {
      expect(screen.getByText('14%')).toBeInTheDocument()
      expect(screen.getByText(/1 de 7 lecciones completadas/i)).toBeInTheDocument()
    })
  })

  it('renders module accordion', async () => {
    render(<CoursePage />)

    await waitFor(() => {
      expect(screen.getByText('Introduccion a React')).toBeInTheDocument()
      expect(screen.getByText('React Hooks')).toBeInTheDocument()
    })
  })

  it('shows lesson list with progress', async () => {
    render(<CoursePage />)

    await waitFor(() => {
      expect(screen.getByText('Que es React')).toBeInTheDocument()
      expect(screen.getByText('JSX Basico')).toBeInTheDocument()
      expect(screen.getByText('Componentes')).toBeInTheDocument()
    })
  })

  it('displays mandatory badge for required lessons', async () => {
    render(<CoursePage />)

    await waitFor(() => {
      const mandatoryBadges = screen.getAllByText(/obligatorio/i)
      expect(mandatoryBadges.length).toBeGreaterThan(0)
    })
  })

  it('links to lesson detail page', async () => {
    render(<CoursePage />)

    await waitFor(() => {
      const lessonLinks = screen.getAllByRole('link')
      const lessonLink = lessonLinks.find(link =>
        link.getAttribute('href')?.includes('/leccion/')
      )
      expect(lessonLink).toBeTruthy()
    })
  })

  it('has back button to campus', async () => {
    render(<CoursePage />)

    await waitFor(() => {
      const backButton = screen.getByText(/volver a mis cursos/i)
      expect(backButton).toBeInTheDocument()
    })
  })

  it('handles API error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Not found' }),
    })

    render(<CoursePage />)

    await waitFor(() => {
      expect(screen.getByText(/failed to load course/i)).toBeInTheDocument()
      expect(screen.getByText(/volver al campus/i)).toBeInTheDocument()
    })
  })
})
