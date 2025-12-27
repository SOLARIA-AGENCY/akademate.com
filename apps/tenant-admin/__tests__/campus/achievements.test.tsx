import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import AchievementsPage from '@/app/campus/logros/page'

// Mock gamification data
const mockGamificationData = {
  totalPoints: 450,
  currentStreak: 5,
  longestStreak: 12,
  level: 5,
  levelProgress: 50,
  nextLevelPoints: 500,
  badges: [
    {
      id: 'first-lesson',
      name: 'Primera Leccion',
      description: 'Completa tu primera leccion',
      icon: 'book',
      category: 'learning',
      isEarned: true,
      earnedAt: '2025-01-10T00:00:00Z',
    },
    {
      id: 'streak-3',
      name: 'En Racha',
      description: 'Estudia 3 dias seguidos',
      icon: 'flame',
      category: 'streak',
      isEarned: true,
      earnedAt: '2025-01-13T00:00:00Z',
    },
    {
      id: 'streak-7',
      name: 'Semana Perfecta',
      description: 'Estudia 7 dias seguidos',
      icon: 'flame',
      category: 'streak',
      isEarned: false,
      progress: 71,
      requirement: 'Racha de 7 dias',
    },
  ],
  recentActivity: [
    {
      id: '1',
      type: 'points',
      title: 'Leccion Completada',
      description: 'Has ganado puntos por completar una leccion',
      points: 10,
      earnedAt: '2025-01-15T10:00:00Z',
    },
  ],
  stats: {
    coursesCompleted: 1,
    lessonsCompleted: 25,
    hoursLearned: 8,
    daysActive: 12,
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

describe('Campus Achievements Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem('campus_token', 'test-token')

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockGamificationData,
      }),
    })
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('renders page title', async () => {
    render(<AchievementsPage />)

    await waitFor(() => {
      expect(screen.getByText(/logros y recompensas/i)).toBeInTheDocument()
    })
  })

  it('displays level information', async () => {
    render(<AchievementsPage />)

    await waitFor(() => {
      expect(screen.getByText('Nivel 5')).toBeInTheDocument()
      expect(screen.getByText(/450 \/ 500 pts/i)).toBeInTheDocument()
    })
  })

  it('shows total points', async () => {
    render(<AchievementsPage />)

    await waitFor(() => {
      expect(screen.getByText('450')).toBeInTheDocument()
      expect(screen.getByText(/puntos totales/i)).toBeInTheDocument()
    })
  })

  it('displays current streak', async () => {
    render(<AchievementsPage />)

    await waitFor(() => {
      // The streak is shown as "5" with "Dias Seguidos (Max: 12)"
      const streakTexts = screen.getAllByText(/dias seguidos/i)
      expect(streakTexts.length).toBeGreaterThan(0)
    })
  })

  it('shows earned badges count', async () => {
    render(<AchievementsPage />)

    await waitFor(() => {
      expect(screen.getByText('2/3')).toBeInTheDocument()
      expect(screen.getByText(/insignias ganadas/i)).toBeInTheDocument()
    })
  })

  it('displays learning stats', async () => {
    render(<AchievementsPage />)

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument() // courses completed
      expect(screen.getByText('25')).toBeInTheDocument() // lessons completed
      expect(screen.getByText('8')).toBeInTheDocument() // hours learned
      expect(screen.getByText('12')).toBeInTheDocument() // days active
    })
  })

  it('renders earned badges tab', async () => {
    render(<AchievementsPage />)

    await waitFor(() => {
      expect(screen.getByText(/ganadas \(2\)/i)).toBeInTheDocument()
      expect(screen.getByText('Primera Leccion')).toBeInTheDocument()
      expect(screen.getByText('En Racha')).toBeInTheDocument()
    })
  })

  it('renders locked badges tab', async () => {
    render(<AchievementsPage />)

    await waitFor(() => {
      expect(screen.getByText(/por desbloquear \(1\)/i)).toBeInTheDocument()
    })
  })

  it('shows progress for locked badges', async () => {
    render(<AchievementsPage />)

    // Wait for data to load and check locked badge content
    // Note: Mock tabs render all content, so we can check directly
    await waitFor(() => {
      expect(screen.getByText('Semana Perfecta')).toBeInTheDocument()
      // Progress is shown as "71% completado"
      expect(screen.getByText(/71%.*completado/i)).toBeInTheDocument()
    })
  })

  it('displays recent activity', async () => {
    render(<AchievementsPage />)

    // Note: Mock tabs render all content, check directly
    await waitFor(() => {
      expect(screen.getByText('Leccion Completada')).toBeInTheDocument()
      expect(screen.getByText('+10 pts')).toBeInTheDocument()
    })
  })

  it('handles empty gamification data', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          totalPoints: 0,
          currentStreak: 0,
          longestStreak: 0,
          level: 1,
          levelProgress: 0,
          nextLevelPoints: 100,
          badges: [],
          recentActivity: [],
          stats: {
            coursesCompleted: 0,
            lessonsCompleted: 0,
            hoursLearned: 0,
            daysActive: 0,
          },
        },
      }),
    })

    render(<AchievementsPage />)

    await waitFor(() => {
      expect(screen.getByText('Nivel 1')).toBeInTheDocument()
      expect(screen.getByText(/aun sin insignias/i)).toBeInTheDocument()
    })
  })

  it('handles API failure gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    render(<AchievementsPage />)

    // Should show default empty state
    await waitFor(() => {
      expect(screen.getByText('Nivel 1')).toBeInTheDocument()
    })
  })
})
