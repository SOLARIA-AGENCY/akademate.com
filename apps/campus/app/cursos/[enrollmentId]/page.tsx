'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Wifi, WifiOff } from 'lucide-react'
import { ProgressBar } from '@/components/ProgressBar'
import { LevelBadge, StreakIndicator, PointsAnimation } from '@/components/gamification'
import { fetchEnrollmentDetail } from '@/lib/api'
import { useCourseProgress, useGamification } from '@/hooks'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PageProps {
    params: Promise<{ enrollmentId: string }>
}

interface ModuleWithProgress {
    id: string
    title: string
    description?: string
    order: number
    duration?: number
    lessonsCompleted: number
    lessonsTotal: number
    lessons: { id: string; title: string }[]
}

// Enrollment detail data types (matches API response)
interface EnrollmentCourse {
    id: string
    title: string
    slug: string
    description?: string
    thumbnail?: string
}

interface EnrollmentCourseRun {
    id: string
    title: string
    startDate: string
    endDate: string
    status: string
    courseId?: string // For resolving course ID
}

interface EnrollmentLessonProgress {
    status: string
    progressPercent: number
}

interface EnrollmentLesson {
    id: string
    title: string
    description?: string
    order: number
    estimatedMinutes?: number
    isMandatory: boolean
    progress: EnrollmentLessonProgress
}

interface EnrollmentModule {
    id: string
    title: string
    description?: string
    order: number
    estimatedMinutes?: number
    lessons: EnrollmentLesson[]
    lessonsCount: number
}

interface EnrollmentProgress {
    totalModules: number
    totalLessons: number
    completedLessons: number
    progressPercent: number
    status: string
}

interface EnrollmentDetailData {
    enrollment: {
        id: string
        status: string
        enrolledAt: string
        startedAt?: string
        completedAt?: string
    }
    course: EnrollmentCourse | null
    courseRun: EnrollmentCourseRun | null
    modules: EnrollmentModule[]
    progress: EnrollmentProgress
}

// Course progress types (matches hook return)
interface CourseProgress {
    enrollmentId: string
    courseId: string
    overallProgress: number
    modulesCompleted: number
    modulesTotal: number
    lessonsCompleted: number
    lessonsTotal: number
    timeSpent: number
    lastActivity: string
}

// Gamification types (matches hook return)
interface Badge {
    id: string
    name: string
    description: string
    icon: string
    earnedAt: string
    rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

interface Achievement {
    id: string
    type: 'lesson_complete' | 'module_complete' | 'course_complete' | 'streak' | 'speed' | 'perfect'
    title: string
    description: string
    pointsAwarded: number
    earnedAt: string
}

interface GamificationData {
    userId: string
    points: number
    level: number
    levelProgress: number
    pointsToNextLevel: number
    currentStreak: number
    longestStreak: number
    badges: Badge[]
    recentAchievements: Achievement[]
    rank?: number
}

interface PointsAnimationData {
    id: string
    points: number
    reason: string
    timestamp: Date
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function CoursePage({ params }: PageProps) {
    const [enrollmentId, setEnrollmentId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [courseTitle, setCourseTitle] = useState('Cargando...')
    const [courseId, setCourseId] = useState<string | null>(null)
    const [modules, setModules] = useState<ModuleWithProgress[]>([])
    const [progress, setProgress] = useState(0)

    // Real-time hooks with type assertions
    // Cast hook functions to typed versions to resolve ESLint type resolution issues
    const typedUseCourseProgress = useCourseProgress as (options: {
        enrollmentId: string
        enableRealtime?: boolean
    }) => {
        progress: CourseProgress | null
        isConnected: boolean
        loading: boolean
        lastUpdate: Date | null
        updateLessonProgress: (lessonId: string, data: Record<string, unknown>) => void
        markLessonComplete: (lessonId: string) => void
        refresh: () => void
    }

    const typedUseGamification = useGamification as (options: {
        courseId?: string
        enableRealtime?: boolean
    }) => {
        data: GamificationData | null
        pendingAnimations: PointsAnimationData[]
        isConnected: boolean
        loading: boolean
        lastUpdate: Date | null
        dismissAnimation: (id: string) => void
        refresh: () => void
    }

    const courseProgressResult = typedUseCourseProgress({
        enrollmentId: enrollmentId ?? '',
        enableRealtime: !!enrollmentId,
    })

    const gamificationResult = typedUseGamification({
        courseId: courseId ?? undefined,
        enableRealtime: !!enrollmentId,
    })

    const realtimeProgress = courseProgressResult.progress
    const progressConnected = courseProgressResult.isConnected
    const gamification = gamificationResult.data
    const pendingAnimations = gamificationResult.pendingAnimations
    const gamificationConnected = gamificationResult.isConnected
    const dismissAnimation = gamificationResult.dismissAnimation

    const isConnected = progressConnected || gamificationConnected
    const certificateReady = progress >= 100

    useEffect(() => {
        void params.then(p => setEnrollmentId(p.enrollmentId))
    }, [params])

    // Sync real-time progress with local state
    useEffect(() => {
        if (realtimeProgress?.overallProgress !== undefined) {
            setProgress(realtimeProgress.overallProgress)
        }
    }, [realtimeProgress?.overallProgress])

    useEffect(() => {
        if (!enrollmentId) return

        async function loadData() {
            try {
                setLoading(true)

                // Fetch enrollment with course content from real API
                // Cast the API function to resolve ESLint type resolution issues
                const typedFetchEnrollmentDetail = fetchEnrollmentDetail as (id: string) => Promise<EnrollmentDetailData>
                const data = await typedFetchEnrollmentDetail(enrollmentId!)

                // Set course title and ID from actual data
                setCourseTitle(data.course?.title ?? data.courseRun?.title ?? 'Sin título')
                // courseRun has courseId reference, course has id directly
                const resolvedCourseId: string | null = data.course?.id ?? data.courseRun?.courseId ?? null
                setCourseId(resolvedCourseId)

                // Set overall progress
                setProgress(data.progress.progressPercent)

                // Map modules with lesson progress
                const mappedModules: ModuleWithProgress[] = data.modules.map((mod: EnrollmentModule) => {
                    const completedLessons = mod.lessons.filter(
                        (l: EnrollmentLesson) => l.progress.status === 'completed'
                    ).length

                    return {
                        id: mod.id,
                        title: mod.title,
                        description: mod.description,
                        order: mod.order,
                        duration: mod.estimatedMinutes,
                        lessonsCompleted: completedLessons,
                        lessonsTotal: mod.lessonsCount,
                        lessons: mod.lessons.map((l: EnrollmentLesson) => ({ id: l.id, title: l.title })),
                    }
                })

                setModules(mappedModules)
                setError(null)
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Error al cargar el curso'
                setError(message)
            } finally {
                setLoading(false)
            }
        }

        void loadData()
    }, [enrollmentId])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-pulse text-muted-foreground">Cargando curso...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-destructive">{error}</p>
                <Link href="/" className="text-primary hover:underline">← Volver a mis cursos</Link>
            </div>
        )
    }

    return (
        <>
            {/* Points Animation Overlay */}
            <PointsAnimation
                animations={pendingAnimations}
                onDismiss={dismissAnimation}
            />

            <div className="max-w-6xl mx-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Header */}
                        <div className="flex items-center justify-between gap-4">
                            <Link href="/" className="text-muted-foreground hover:text-foreground">
                                ← Mis cursos
                            </Link>

                            {/* Connection status */}
                            <div className="flex items-center gap-1 text-xs">
                                {isConnected ? (
                                    <>
                                        <Wifi className="h-3 w-3 text-green-500" />
                                        <span className="text-green-600">En vivo</span>
                                    </>
                                ) : (
                                    <>
                                        <WifiOff className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-muted-foreground">Sin conexión</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-3xl font-bold">{courseTitle}</h1>
                            <ProgressBar value={progress} className="max-w-md" />
                        </div>

                        {/* Modules List */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold">Módulos</h2>

                            <div className="space-y-3">
                                {modules.map((module, index) => (
                                    <div
                                        key={module.id}
                                        className="rounded-xl border border-border bg-card/80 p-4 hover:bg-card transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex gap-4">
                                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <h3 className="font-medium">{module.title}</h3>
                                                    {module.description && (
                                                        <p className="text-sm text-muted-foreground">{module.description}</p>
                                                    )}
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {module.lessonsCompleted}/{module.lessonsTotal} lecciones
                                                        {module.duration && ` • ${module.duration} min`}
                                                    </p>
                                                </div>
                                            </div>

                                            <Link
                                                href={`/cursos/${enrollmentId}/lecciones/${module.lessons[0]?.id ?? module.id}?moduleId=${module.id}`}
                                                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                                            >
                                                {module.lessonsCompleted > 0 ? 'Continuar' : 'Empezar'}
                                            </Link>
                                        </div>

                                        <div className="mt-3">
                                            <ProgressBar
                                                value={module.lessonsTotal > 0 ? Math.round((module.lessonsCompleted / module.lessonsTotal) * 100) : 0}
                                                showLabel={false}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Gamification Sidebar */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* Level & Points */}
                        <div className="rounded-xl border border-border bg-card/80 p-4">
                            <h3 className="text-sm font-medium text-muted-foreground mb-3">Tu progreso</h3>
                            {gamification ? (
                                <LevelBadge
                                    level={gamification.level}
                                    progress={gamification.levelProgress}
                                    points={gamification.points}
                                    size="md"
                                />
                            ) : (
                                <div className="animate-pulse">
                                    <div className="h-14 bg-muted rounded-full w-14"></div>
                                </div>
                            )}
                        </div>

                        {/* Streak */}
                        <div className="rounded-xl border border-border bg-card/80 p-4">
                            <h3 className="text-sm font-medium text-muted-foreground mb-3">Racha de estudio</h3>
                            {gamification ? (
                                <StreakIndicator
                                    currentStreak={gamification.currentStreak}
                                    longestStreak={gamification.longestStreak}
                                />
                            ) : (
                                <div className="animate-pulse">
                                    <div className="h-16 bg-muted rounded-lg"></div>
                                </div>
                            )}
                        </div>

                        {/* Certificate */}
                        <div className="rounded-xl border border-border bg-card/80 p-4">
                            <h3 className="text-sm font-medium text-muted-foreground mb-3">Certificado</h3>
                            <div className="space-y-2 text-sm">
                                <p className={certificateReady ? 'text-green-600' : 'text-muted-foreground'}>
                                    {certificateReady ? 'Disponible para descargar' : 'Completa el 100% para habilitarlo'}
                                </p>
                                <button
                                    type="button"
                                    disabled={!certificateReady}
                                    className="w-full rounded-lg border border-primary/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-primary disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Descargar certificado
                                </button>
                            </div>
                        </div>

                        {/* Badges */}
                        {gamification && gamification.badges.length > 0 && (
                            <div className="rounded-xl border border-border bg-card/80 p-4">
                                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                                    Insignias ({gamification.badges.length})
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {gamification.badges.slice(0, 6).map((badge: Badge) => (
                                        <div
                                            key={badge.id}
                                            className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-xl shadow-md"
                                            title={`${badge.name}: ${badge.description}`}
                                        >
                                            {badge.icon}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recent Achievements */}
                        {gamification && gamification.recentAchievements.length > 0 && (
                            <div className="rounded-xl border border-border bg-card/80 p-4">
                                <h3 className="text-sm font-medium text-muted-foreground mb-3">Logros recientes</h3>
                                <div className="space-y-2">
                                    {gamification.recentAchievements.slice(0, 3).map((achievement: Achievement) => (
                                        <div
                                            key={achievement.id}
                                            className="flex items-center gap-2 text-sm"
                                        >
                                            <span className="text-yellow-500">⭐</span>
                                            <span className="flex-1 truncate">{achievement.title}</span>
                                            <span className="text-xs text-green-500">+{achievement.pointsAwarded}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
