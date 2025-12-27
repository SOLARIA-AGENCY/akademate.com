import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import LessonPage from '@/app/campus/cursos/[enrollmentId]/leccion/[lessonId]/page'

// Mock lesson data
const mockLessonData = {
  lesson: {
    id: 'lesson-1',
    title: 'Introduccion a React Hooks',
    description: 'Aprende los fundamentos de los hooks de React',
    content: '<p>Los hooks son funciones especiales...</p>',
    order: 1,
    estimatedMinutes: 25,
    isMandatory: true,
    videoUrl: 'https://example.com/video.mp4',
    videoDuration: 900,
  },
  module: {
    id: 'mod-1',
    title: 'React Hooks',
  },
  course: {
    id: 'course-1',
    title: 'Curso de React Avanzado',
  },
  enrollment: {
    id: 'enr-1',
  },
  progress: {
    status: 'in_progress',
    progressPercent: 45,
    videoProgress: 45,
    lastPosition: 405,
  },
  materials: [
    {
      id: 'mat-1',
      title: 'Guia de Hooks PDF',
      type: 'pdf',
      url: 'https://example.com/hooks.pdf',
      size: '2.5 MB',
    },
  ],
  navigation: {
    previousLesson: { id: 'lesson-0', title: 'Introduccion al Curso' },
    nextLesson: { id: 'lesson-2', title: 'useState en Detalle' },
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
    useRouter: () => ({ push: vi.fn() }),
    useParams: () => ({
      enrollmentId: 'enr-1',
      lessonId: 'lesson-1',
    }),
  }
})

describe('Campus Lesson Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem('campus_token', 'test-token')

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockLessonData,
      }),
    })
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('renders lesson title and module', async () => {
    render(<LessonPage />)

    await waitFor(() => {
      expect(screen.getByText('Introduccion a React Hooks')).toBeInTheDocument()
      expect(screen.getByText('React Hooks')).toBeInTheDocument()
    })
  })

  it('displays video player when video URL exists', async () => {
    render(<LessonPage />)

    await waitFor(() => {
      const video = document.querySelector('video')
      expect(video).toBeTruthy()
      expect(video).toHaveAttribute('src', 'https://example.com/video.mp4')
    })
  })

  it('shows lesson progress', async () => {
    render(<LessonPage />)

    await waitFor(() => {
      // Progress is displayed in multiple places as "45% completado"
      const progressElements = screen.getAllByText(/45%.*completado/i)
      expect(progressElements.length).toBeGreaterThan(0)
    })
  })

  it('displays materials section', async () => {
    render(<LessonPage />)

    await waitFor(() => {
      expect(screen.getByText('Materiales')).toBeInTheDocument()
      expect(screen.getByText('Guia de Hooks PDF')).toBeInTheDocument()
      expect(screen.getByText('2.5 MB')).toBeInTheDocument()
    })
  })

  it('shows navigation to previous/next lessons', async () => {
    render(<LessonPage />)

    await waitFor(() => {
      expect(screen.getByText('Introduccion al Curso')).toBeInTheDocument()
      expect(screen.getByText('useState en Detalle')).toBeInTheDocument()
    })
  })

  it('has mark as complete button', async () => {
    render(<LessonPage />)

    await waitFor(() => {
      expect(screen.getByText(/marcar como completada/i)).toBeInTheDocument()
    })
  })

  it('calls API when mark complete is clicked', async () => {
    render(<LessonPage />)

    await waitFor(async () => {
      const completeButton = screen.getByText(/marcar como completada/i)
      fireEvent.click(completeButton)
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/lms/progress',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })
  })

  it('shows estimated time badge', async () => {
    render(<LessonPage />)

    await waitFor(() => {
      expect(screen.getByText('25 min')).toBeInTheDocument()
    })
  })

  it('shows mandatory badge for required lessons', async () => {
    render(<LessonPage />)

    await waitFor(() => {
      expect(screen.getByText(/obligatorio/i)).toBeInTheDocument()
    })
  })

  it('handles completed lesson state', async () => {
    const completedData = {
      ...mockLessonData,
      progress: {
        status: 'completed',
        progressPercent: 100,
        completedAt: '2025-01-15T10:00:00Z',
      },
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: completedData }),
    })

    render(<LessonPage />)

    await waitFor(() => {
      expect(screen.getByText(/leccion completada/i)).toBeInTheDocument()
      expect(screen.queryByText(/marcar como completada/i)).not.toBeInTheDocument()
    })
  })

  it('handles API error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Not found' }),
    })

    render(<LessonPage />)

    await waitFor(() => {
      expect(screen.getByText(/failed to load lesson/i)).toBeInTheDocument()
      expect(screen.getByText(/volver al curso/i)).toBeInTheDocument()
    })
  })
})
